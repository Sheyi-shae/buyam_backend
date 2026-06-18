import { Server, Socket } from "socket.io";
import db from "../libs/db.js";
import { CustomError } from "../middleware/error-middleware.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { parse as parseCookies } from "cookie";

// Multi-device support: userId → Set of socket IDs (Set prevents duplicates on reconnect)
const activeUsers: Record<number, Set<string>> = {};

interface ChatMessage {
  buyerId: number;
  sellerId: number;
  productId: number;
  senderId: number;
  content: string;
  type?: string;
  avatar?: string;
  tempId?: string;
  isUploading?: boolean;
}

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
  // JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const rawCookie = socket.handshake.headers?.cookie;
      if (!rawCookie) {
        return next(new Error("Authentication required"));
      }

      const cookies = parseCookies(rawCookie);
      const token = cookies["accessToken"];
      
      if (!token) {
        return next(new Error("No access token provided"));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      console.log("payload details",payload)
      
      if (!payload?.sub) {
        return next(new Error("Invalid token payload"));
      }

     
      socket.data.userId = payload.sub;
      next();
    } catch (err) {
      console.error("Socket auth error:", err);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const authenticatedUserId: number = socket.data.userId;
    console.log(`Socket connected: ${socket.id} (user ${authenticatedUserId})`);

    /** --- Join --- */
    socket.on("join", async () => {
     
      const userId = authenticatedUserId;
      
      if (!activeUsers[userId]) activeUsers[userId] = new Set();
      activeUsers[userId].add(socket.id);
      socket.join(userId.toString());
      console.log(`User ${userId} joined (socket ${socket.id})`);

      await db.user.update({
        where: { id: userId },
        data: { online: true },
      });
    });

    /** --- Send a message --- */
    socket.on("message:send", async (msg: ChatMessage) => {
      const { buyerId, sellerId, productId, content, type, avatar, tempId } = msg;
      // Use authenticated userId as senderId - ignore any senderId from client
      const senderId = authenticatedUserId;
      
      try {
        const existing = await db.conversation.findUnique({
          where: { productId_buyerId: { productId, buyerId } },
        });

        if (!existing && sellerId === senderId) {
          const err = new Error("Message sending failed") as CustomError;
          err.statusCode = 400;
          throw err;
        }

        // FIX: upsert eliminates race condition on simultaneous first messages
        const conversation = await db.conversation.upsert({
          where: { productId_buyerId: { productId, buyerId } },
          create: { productId, buyerId, sellerId, lastMessage: content, lastMessageAt: new Date(), lastMessageSenderId: senderId },
          update: { lastMessage: content, lastMessageAt: new Date(), lastMessageSenderId: senderId },
        });

        const message = await db.message.create({
          data: {
            conversationId: conversation.id,
            senderId,
            content,
            type: type || "text",
            avatar: avatar || null,
          },
        });

        if (tempId) {
          socket.data.tempMessageMap = socket.data.tempMessageMap || {};
          // FIX: scope key by conversationId to avoid collisions across conversations
          socket.data.tempMessageMap[`${conversation.id}:${tempId}`] = message.id;
        }

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

        const messageToSend = { ...message, tempId: tempId || undefined };

        activeUsers[buyerId]?.forEach((sid) => io.to(sid).emit("message:receive", messageToSend));
        activeUsers[sellerId]?.forEach((sid) => io.to(sid).emit("message:receive", messageToSend));
        activeUsers[buyerId]?.forEach((sid) => io.to(sid).emit("conversation:update", conversation));
        activeUsers[sellerId]?.forEach((sid) => io.to(sid).emit("conversation:update", conversation));
      } catch (err) {
        console.error("message:send error:", err);
        socket.emit("message:error", { message: "Failed to send message." });
      }
    });

    /** --- Update a message (finalise image upload) --- */
    socket.on("message:update", async (update: MessageUpdate) => {
      const { tempId, finalUrl, conversationId, isRead } = update;
      // Use authenticated userId, ignore senderId from client
      const senderId = authenticatedUserId;
      
      try {
        // FIX: scoped key matches the one set in message:send
        const key = `${conversationId}:${tempId}`;
        const realMessageId = socket.data.tempMessageMap?.[key];

        if (!realMessageId) {
          socket.emit("message:error", { message: "Message not found" });
          return;
        }

        const updatedMessage = await db.message.update({
          where: { id: realMessageId },
          data: { avatar: finalUrl, isRead },
        });

        await db.conversation.update({
          where: { id: conversationId },
          data: { lastMessage: updatedMessage.content || "📷 Image", lastMessageAt: new Date(), lastMessageSenderId: senderId },
        });

        const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
        if (conversation) {
          activeUsers[conversation.buyerId]?.forEach((sid) => io.to(sid).emit("message:updated", updatedMessage));
          activeUsers[conversation.sellerId]?.forEach((sid) => io.to(sid).emit("message:updated", updatedMessage));
        }

        delete socket.data.tempMessageMap[key];
      } catch (err) {
        console.error("message:update error:", err);
        socket.emit("message:error", { message: "Failed to update message" });
      }
    });

    /** --- Mark messages as read --- */
    socket.on("message:read", async ({ conversationId }: { conversationId: number }) => {
      // Use authenticated userId, ignore any userId from client
      const userId = authenticatedUserId;
      
      try {
        // FIX: find unread senders before updating so we can notify them
        const unread = await db.message.findMany({
          where: { conversationId, senderId: { not: userId }, isRead: false },
          select: { senderId: true },
        });

        await db.message.updateMany({
          where: { conversationId, senderId: { not: userId } },
          data: { isRead: true },
        });

        io.to(userId.toString()).emit("notification:sync");

        // FIX: notify senders so they can display read receipts
        const senderIds = [...new Set(unread.map((m) => m.senderId))];
        senderIds.forEach((sid) => {
          activeUsers[sid]?.forEach((socketId) =>
            io.to(socketId).emit("message:read-receipt", { conversationId, readerId: userId })
          );
        });
      } catch (err) {
        console.error("message:read error:", err);
      }
    });

    /** --- Delete a message --- */
    socket.on("message:delete", async ({ messageId }: { messageId: number }) => {
      // Use authenticated userId, ignore any userId from client
      const userId = authenticatedUserId;
      
      try {
        const message = await db.message.findUnique({
          where: { id: messageId },
          include: { conversation: { select: { buyerId: true, sellerId: true } } },
        });

        if (!message) {
          socket.emit("message:error", { message: "Message not found" });
          return;
        }

        // Verify the authenticated user owns this message
        if (message.senderId !== userId) {
          socket.emit("message:error", { message: "Not authorized to delete this message" });
          return;
        }

        await db.message.delete({ where: { id: messageId } });

        // FIX: broadcast to both parties so the other side updates in real time
        activeUsers[message.conversation.buyerId]?.forEach((sid) => io.to(sid).emit("message:delete", messageId));
        activeUsers[message.conversation.sellerId]?.forEach((sid) => io.to(sid).emit("message:delete", messageId));
      } catch (err) {
        console.error("message:delete error:", err);
      }
    });

    /** --- Disconnect --- */
    socket.on("disconnect", async () => {
      const userId = authenticatedUserId;

      if (userId && activeUsers[userId]) {  
        activeUsers[userId].delete(socket.id);

        // Only mark offline when the last socket for this user disconnects
        if (activeUsers[userId].size === 0) {
          delete activeUsers[userId];
          await db.user.update({
            where: { id: userId },
            data: { online: false, lastSeen: new Date() },
          });
          console.log(`User ${userId} is now offline`);
        }
      }

      console.log("Socket disconnected:", socket.id);
    });
  });
}