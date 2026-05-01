import { NextFunction, Request, Response } from "express";
import { CustomError } from "../middleware/error-middleware.js";
import db from "../libs/db.js";



// fetch all conversations for logged in user

export const getAllConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId  = req.user?.id;
        //   check if any conv exists
        const conversations = await db.conversation.findMany({
            where: {
                  OR: [
      { buyerId: userId },
      { sellerId: userId },
    ],
            },
            include: {
    buyer: true,       // Get buyer info
    seller: true,      // Get seller info
              product: {
      include: {
        subCategory: true,
      },
    },     // Get product info
    messages: {
      orderBy: {
        createdAt: 'asc', // Optional: sort messages oldest → newest
      },
    },
  },
        });

      //console.log(conversations)
        if (!conversations) {
            const error = new Error('Conversations not found') as CustomError;
            error.statusCode = 404;
            return res.status(404).json({ success: false, message: 'Conversations not found',data:[] });
        }
        return res.status(200).json({ success: true, message: 'Conversations fetched successfully', data: conversations });
    } catch (error) {
        next(error);
    }
}

//unread count for unread messages
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {

    try {
      const userId  = req.user?.id;
      const unreadCount = await db.message.count({
  where: {
    isRead: false,
    senderId: { not: userId },
    conversation: {
      OR: [
        { buyerId: userId },
        { sellerId: userId },
      ],
    },
  },
});
console.log("unread count",unreadCount)
        return res.status(200).json({ success: true, message: 'Unread count fetched successfully', data: unreadCount });
    } catch (error) {
        next(error);
    }
}