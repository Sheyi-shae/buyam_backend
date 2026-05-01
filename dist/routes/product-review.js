import { Router } from 'express';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { getProductReviews, submitProductReview } from '../controllers/product-review.js';
const reviewRouter = Router();
// submit review
reviewRouter.post('/:productId', authMiddleware, submitProductReview);
// get reviews
reviewRouter.get('/:productId', getProductReviews);
export default reviewRouter;
