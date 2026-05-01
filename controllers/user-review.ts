import { Request, Response, NextFunction } from 'express';
import db from '../libs/db.js';
import { CustomError } from '../middleware/error-middleware.js';

export const submitUserReview = async (req: Request, res: Response, next: NextFunction) => {

   
    const { publicId } = req.params;
    const { ratings, comment,name ,userId} = req.body;
    try {
        if (!userId) {
            const error = new Error('User not authenticated') as CustomError;
            error.statusCode = 401;
            throw error;
        }
        // do not allow user to review their own account
        if (userId === req.user?.id) {
            const error = new Error('your cannot review your account') as CustomError;
            error.statusCode = 400;
            throw error;
        }
        if (!name) {
            const error = new Error('Invalid user name') as CustomError;
            error.statusCode = 401;
            throw error;
        }
        // Check if user exists
        const vendor = await db.user.findUnique({
            where: { publicId }
        });
        if (!vendor) {
            const error = new Error('Vendor not found') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        // Create new review
        const newReview = await db.userReview.create({
            data: {
                userId,
                publicId,
                ratings,
                comment,
                name
            }
        })
        console.log(newReview);
        return res.status(201).json(
            {
                message: 'Review submitted successfully',
                data: newReview,
                success: true
            });
        
        
    } catch (error) {
        next(error);
    }
}

// submit review reply
export const submitReviewReply = async (req: Request, res: Response, next: NextFunction) => {
    const { publicId } = req.params;
    const { reply, reviewId, name } = req.body;
    
    try {
        if (!reply) {
            const error = new Error('Invalid review reply') as CustomError;
            error.statusCode = 401;
            throw error;
        }
        // Check if user exists
        const user = await db.user.findUnique({
            where: { publicId }
        });
        if (!user) {
            const error = new Error('User not found') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        // Create new review reply
        const newReply = await db.userReviewReplies.create({
            data: {
                reviewId,
                reply,
                name
                
            }
        })
        console.log(newReply);
        return res.status(201).json(
            {
                message: 'Review reply submitted successfully',
                data: newReply,
                success: true
            });
        
    } catch (error) {
        next(error);
    }
}

// submit review like
export const submitReviewLike = async (req: Request, res: Response, next: NextFunction) => {
  
    const { reviewId,userId } = req.body;
    try {
        if (!reviewId) {
            const error = new Error('Invalid review like') as CustomError;
            error.statusCode = 401;
            throw error;
        }
        // Check if user exists
        const user = await db.user.findUnique({
            where: { id: userId }
        });
        
        if (!user) {
            const error = new Error('User not found') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        // check if user has already liked the review
        const existingLike = await db.userReviewLikes.findFirst({
            where: { reviewId, userId }
        });
        if (existingLike) {
            await db.userReviewLikes.delete({
                where: { id: existingLike.id }
            });
            return res.status(200).json(
                {
                    message: 'Review like removed successfully',
                    success: true
                });
        } else {
          await db.userReviewLikes.create({
            data: {
                reviewId,
                userId
            }
        })
        }
        
       
        return res.status(201).json(
            {
                
                success: true
            });
        
    } catch (error) {
        next(error);
    }
}

// get product reviews
// export const getUserReviews = async (req: Request, res: Response, next: NextFunction) => {
//     const { publicId } = req.params;
//     try {
//         // Check if user exists
//         const user = await db.user.findUnique({
//             where: { publicId }
//         });
//         if (!user) {
//             const error = new Error('User not found') as CustomError;
//             error.statusCode = 404;
//             throw error;
//         }
//         // Get all reviews for the user
//         const reviews = await db.userReview.findMany({
//             where: { publicId: user.publicId },
//             orderBy: { createdAt: 'desc' }
//         });
//         return res.status(200).json(
//             {
//                 message: 'Reviews fetched successfully',
//                 data: reviews,
//                 success: true
//             });
//     } catch (error) {
//         next(error);
//     }
// }