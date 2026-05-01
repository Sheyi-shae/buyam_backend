import { Request, Response, NextFunction } from 'express';
import db from '../libs/db.js';
import { CustomError } from '../middleware/error-middleware.js';



export const submitProductReview = async (req: Request, res: Response, next: NextFunction) => {

    const userId = req.user?.id;
    
  
    const { productId } = req.params;
    const { ratings, comment,name } = req.body;
    const id= Number(productId);
    try {
        if (!userId) {
            const error = new Error('User not authenticated') as CustomError;
            error.statusCode = 401;
            throw error;
        }
          if (userId === req.user?.id) {
            const error = new Error('Your review your listing') as CustomError;
            error.statusCode = 400;
            throw error;
        }
        if (!name) {
            const error = new Error('Invalid user name') as CustomError;
            error.statusCode = 401;
            throw error;
        }
        // Check if product exists
        const product = await db.product.findUnique({
            where: { id }
        });
        if (!product) {
            const error = new Error('Product not found') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        // Create new review
        const newReview = await db.productReview.create({
            data: {
                userId,
                productId: product.id,
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



// get product reviews
export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
    const { productId } = req.params;
    const id = Number(productId);
    try {
        // Check if product exists
        const product = await db.product.findUnique({
            where: { id }
        });
        if (!product) {
            const error = new Error('Product not found') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        // Get all reviews for the product
        const reviews = await db.productReview.findMany({
            where: { productId: product.id },
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json(
            {
                message: 'Reviews fetched successfully',
                data: reviews,
                success: true
            });
    } catch (error) {
        next(error);
    }
}



