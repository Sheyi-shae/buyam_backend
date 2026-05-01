import { Router } from 'express';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { submitReviewLike, submitReviewReply, submitUserReview } from '../controllers/user-review.js';

const UserReviewRouter = Router();

// submit review
UserReviewRouter.post('/:publicId', authMiddleware, submitUserReview);

// submit review reply
UserReviewRouter.post('/:publicId/reply', authMiddleware, submitReviewReply);

// submit review like
UserReviewRouter.post('/:publicId/like', authMiddleware, submitReviewLike);






export default UserReviewRouter;