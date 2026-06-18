import { Router } from 'express';
import { getAllUsers, getLoggedInUserDetails, getUserProfileByPublicId, getVerifiedSellers, updateUserPhone, updateUserStore } from '../controllers/user.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
  

const userRouter = Router();

userRouter.get('/all', getAllUsers);
userRouter.get('/vendor/:publicId', authMiddleware, getUserProfileByPublicId);
userRouter.get('/vendor/public/:publicId',  getUserProfileByPublicId);
userRouter.get('/me', authMiddleware, getLoggedInUserDetails);
userRouter.patch('/phone', authMiddleware, updateUserPhone);
userRouter.patch('/store/:id', authMiddleware, updateUserStore);

// verified seller route
userRouter.get('/verified-sellers', getVerifiedSellers);
export default userRouter;