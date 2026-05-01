import { Router } from 'express';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { toggleProductLike } from '../controllers/product-like.js';
const likeRouter = Router();
// post like or unlike a product
likeRouter.post('/:id', authMiddleware, toggleProductLike);
export default likeRouter;
