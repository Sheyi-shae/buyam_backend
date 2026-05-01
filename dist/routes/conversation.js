import { Router } from 'express';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { getAllConversations, getUnreadCount } from '../controllers/coversation.js';
const conversationRouter = Router();
conversationRouter.get('/', authMiddleware, getAllConversations);
conversationRouter.get('/unread-count', authMiddleware, getUnreadCount);
export default conversationRouter;
