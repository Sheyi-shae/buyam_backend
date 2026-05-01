import { NextFunction, Request, Response } from "express";
import { CustomError } from "../middleware/error-middleware.js";
import slugify from "../libs/slugify.js";
import db from "../libs/db.js";

// create a new sub-category
export const createSubCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, avatar, description, categoryId } = req.body;
        //slugify name
        const slug = slugify(name);
        //check if sub-category already exists
        const existingSubCategory = await db.subCategory.findUnique({
            where: { slug }
        });
        if (existingSubCategory) {
            const error = new Error('sub category already exists') as CustomError;
            error.statusCode = 400;
            throw error;
        }
        const subCategory = await db.subCategory.create({
            data: {
                name,
                description,
                slug,
                avatar,
                categoryId
            }
        });
        return res.status(201).json({
            success: true,
            message: 'sub-category created successfully',
            data: subCategory
        });
    } catch (error) {
        next(error);
    }
}

// get all sub-categories with product 
export const getAllSubCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const subCategories = await db.subCategory.findMany({
            include: {
                products: true
            }
        });

        res.status(200).json({
            success: true,
            data: subCategories
        });
    } catch (error) {
        next(error);
    }
}

// get sub-category by slug
export const getSubCategoryBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { slug } = req.params;
        //check if sub-category exists
        const subCategory = await db.subCategory.findUnique({
            where: { slug },
            include: {
                products: true
            }
        });

        if (!subCategory) {
            const error = new Error('Sub-category not found') as CustomError;
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            data: subCategory
        });
    } catch (error) {
        next(error);
    }
}
//edit sub-category by slug
export const editSubCategoryBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { slug } = req.params;
        const { name, description, avatar, categoryId } = req.body;
        //check if sub-category exists
        const subCategory = await db.subCategory.findUnique({
            where: { slug }
        });
        if (!subCategory) {
            const error = new Error('Sub-category not found') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        //slugify name
        const newSlug = slugify(name);
        //check if new slug already exists
        const existingSubCategory = await db.subCategory.findUnique({
            where: { slug: newSlug }
        });
        if (existingSubCategory) {
            const error = new Error('sub category already exists') as CustomError;
            error.statusCode = 400;
            throw error;
        }
        const updatedSubCategory = await db.subCategory.update({
            where: { slug },
            data: {
                name,
                avatar,
                description,
                slug: newSlug,
                categoryId
            }
        });
        res.status(200).json({
            success: true,
            message: 'sub-category updated successfully',
            data: updatedSubCategory
        });
    } catch (error) {
        next(error);
    }
}

// delete sub-category by slug
export const deleteSubCategoryBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { slug } = req.params;
        //check if sub-category exists
        const subCategory = await db.subCategory.findUnique({
            where: { slug }
        });
        if (!subCategory) {
            const error = new Error('Sub-category not found') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        await db.subCategory.delete({
            where: { slug }
        });
        res.status(200).json({
            success: true,
            message: 'sub-category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}

//delete all sub-categories
export const deleteAllSubCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await db.subCategory.deleteMany();
        res.status(200).json({
            success: true,
            message: 'all sub-categories deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}