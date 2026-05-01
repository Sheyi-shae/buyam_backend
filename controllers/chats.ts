import { Server, Socket } from "socket.io";
import db from "../libs/db.js";
import { error } from "console";
import { CustomError } from "../middleware/error-middleware.js";

// Multi-device support: userId → array of socket IDs
const activeUsers: Record<number, string[]> = {};

// Message payload type
interface ChatMessage {
  buyerId: number;
  sellerId: number;
  productId: number;
  senderId: number;
  content: string;
  type?: string;    // "text" | "image" | "system"
  avatar?: string;
  tempId?: string;  // NEW: for linking temp messages
  isUploading?: boolean;
}

// Message update payload
interface MessageUpdate {
  tempId: string;
  finalUrl: string;
  conversationId: number;
  isRead: boolean;
  senderId: number;
  type: string;
  content: string;
}

export default function chatSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    /** --- Join user room --- */
    socket.on("join", async (userId: number) => {
      if (!activeUsers[userId]) activeUsers[userId] = [];
      activeUsers[userId].push(socket.id);
      socket.join(userId.toString());
      console.log(`User ${userId} joined room ${userId}`);

      // mark user online
      console.log("user online", userId)
      await db.user.update({
        where: { id: userId },
        data: { online: true },
      });
    });

    /** --- Send a message --- */
    socket.on("message:send", async (msg: ChatMessage) => {
      const { buyerId, sellerId, productId, senderId, content, type, avatar, tempId, isUploading } = msg;
      try {
        
      
        // Check if conversation exists
        let conversation = await db.conversation.findUnique({
          where: { productId_buyerId: { productId, buyerId } },
        });
        if (!conversation && sellerId === senderId) {
            const error = new Error('Message sending failed') as CustomError;
          error.statusCode = 400;
          throw error;
        }

        // Create conversation if not exists
        if (!conversation) {
          conversation = await db.conversation.create({
            data: {
              productId,
              buyerId,
              sellerId,
              lastMessageSenderId: senderId,
              lastMessage: content,
              lastMessageAt: new Date(),
            },
          });
        } else {
          // Update last message
          conversation = await db.conversation.update({
            where: { id: conversation.id },
            data: { lastMessage: content, lastMessageAt: new Date(), lastMessageSenderId: senderId },
          });
        }

        // Create message in database
        const message = await db.message.create({
          data: {
            conversationId: conversation.id,
            senderId,
            content: isUploading ? content : content, // Keep user's text, don't replace with "Uploading..."
            type: type || "text",
            avatar: avatar || null,
          },
        });

         // 4️⃣ Notify receiver ONLY
    const receiverId = senderId === buyerId ? sellerId : buyerId;

    activeUsers[receiverId]?.forEach((sid) => {
      io.to(sid).emit("notification:new-message", {
        conversationId: conversation.id,
        senderId,
        messageId: message.id,
        type: message.type,
      });

      io.to(sid).emit("notification:sync");
    });
        // If there's a tempId, store the mapping for later update
        if (tempId) {
          socket.data.tempMessageMap = socket.data.tempMessageMap || {};
          socket.data.tempMessageMap[tempId] = message.id;
        }

        // Broadcast message to all devices of both users
        // Include tempId so frontend can replace temp message with real one
        const messageToSend = { 
          ...message, 
          tempId: tempId || undefined 
        };
        
        activeUsers[buyerId]?.forEach((id) => 
          io.to(id).emit("message:receive", messageToSend)
        );
        activeUsers[sellerId]?.forEach((id) => 
          io.to(id).emit("message:receive", messageToSend)
        );


        

        // Optional: notify both parties to refresh conversation list
        activeUsers[buyerId]?.forEach((id) =>
          io.to(id).emit("conversation:update", conversation)
        );
        activeUsers[sellerId]?.forEach((id) =>
          io.to(id).emit("conversation:update", conversation)
        );

      } catch (err) {
        console.error("Message send error:", err);
        socket.emit("message:error", { message: "Failed to send message." });
      }
    });

    /** --- NEW: Update a message (for image uploads) --- */
    socket.on("message:update", async (update: MessageUpdate) => {
      const { tempId, finalUrl, conversationId,isRead, senderId } = update;
      
      try {
        // Get the real message ID from the temp mapping
        const realMessageId = socket.data.tempMessageMap?.[tempId];
        
        if (!realMessageId) {
          console.error("No message found for tempId:", tempId);
          socket.emit("message:error", { message: "Message not found" });
          return;
        }

        // Update the message in database - ONLY update avatar, keep content
        const updatedMessage = await db.message.update({
          where: { id: realMessageId },
          data: {
            avatar: finalUrl,
            isRead,
            // Store image URL in avatar field
            // DON'T update content - it contains the user's text caption
          },
        });

        // Also update conversation's last message if needed
        await db.conversation.update({
          where: { id: conversationId },
          data: { 
            lastMessage: updatedMessage.content || "📷 Image",
            lastMessageAt: new Date(),
            lastMessageSenderId: senderId
          },
        });

        // Get conversation details to broadcast to correct users
        const conversation = await db.conversation.findUnique({
          where: { id: conversationId },
        });

        if (conversation) {
          const { buyerId, sellerId } = conversation;

          // Broadcast updated message to all devices
          activeUsers[buyerId]?.forEach((id) => 
            io.to(id).emit("message:updated", updatedMessage)
          );
          activeUsers[sellerId]?.forEach((id) => 
            io.to(id).emit("message:updated", updatedMessage)
          );
        }

        // Clean up the temp mapping
        delete socket.data.tempMessageMap[tempId];

      } catch (err) {
        console.error("Message update error:", err);
        socket.emit("message:error", { message: "Failed to update message" });
      }
    });

    /** --- Mark message as read --- */
 socket.on("message:read", async ({ conversationId, userId }: { conversationId: number; userId: number }) => {
  try {
    await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
      },
      data: { isRead: true },
    });

      io.to(userId.toString()).emit("notification:sync");
    
  } catch (err) {
    console.error("Message read error:", err);
  }
});


  

    /** --- Delete message --- */
    socket.on("message:delete", async (
      { messageId, userId }: { messageId: number; userId: number }) => {
      try {
        await db.message.delete({
          where: { id: messageId },
        });
        // Emit to all devices of user
        activeUsers[userId]?.forEach((id) => io.to(id).emit("message:delete", messageId));
      } catch (err) {
        console.error("Message delete error:", err);
      }
    });

    /** --- Handle disconnect --- */
    socket.on("disconnect", async() => {
       let disconnectedUserId = null;

      

      for (const [userId, sockets] of Object.entries(activeUsers)) {
        activeUsers[Number(userId)] = sockets.filter((id) => id !== socket.id);
        if (!activeUsers[Number(userId)].length) {
          disconnectedUserId = Number(userId);
           delete activeUsers[Number(userId)];
        }
         
      }
      if (disconnectedUserId) {
        await db.user.update({
          where: { id: disconnectedUserId },
          data: {
            online: false,
            lastSeen: new Date(),
          },
        });
      }
      console.log("User disconnected:", socket.id);
    });
  });
}