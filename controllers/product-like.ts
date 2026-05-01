// controllers/product-like.ts
import { Request, Response, NextFunction } from 'express';
import db from '../libs/db.js';
import { CustomError } from '../middleware/error-middleware.js';



export const toggleProductLike = async (req: Request, res: Response, next: NextFunction) => {

    const userId = req.user?.id;
    const { id: productId } = req.params;

    try {
        if (!userId) {
            const error = new Error('User not authenticated') as CustomError;
            error.statusCode = 401;
            throw error;
        }
        // Check if product exists
        const product = await db.product.findUnique({
            where: { id: Number(productId) }
        });
        if (!product) {
            const error = new Error('Product not found') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        // Check if like already exists
        const existingLike = await db.productLike.findFirst({
            where: {
                userId: userId,
                productId: Number(productId)
            }
        });
        if (existingLike) {
            
            await db.productLike.delete({
                where: { id: existingLike.id }
            });
            return res.status(200).json({ message: 'Item removed from favorites' });
        } else {
            // If like does not exist, create it (like)
            await db.productLike.create({
                data: {
                    userId: userId,
                    productId: Number(productId)
                }
            });
            return res.status(200).json({ message: 'Item added to favorites' });
        }

    } catch (error) {
        next(error);
    }
}