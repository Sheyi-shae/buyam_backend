// create a new product
import slugify from "../libs/slugify.js";
import db from "../libs/db.js";
export const createCategory = async (req, res, next) => {
    const { name, description, avatar } = req.body;
    try {
        //slugify name
        const slug = slugify(name, { lower: true, strict: true });
        //check if category already exists
        const existingCategory = await db.category.findUnique({
            where: { slug }
        });
        if (existingCategory) {
            const error = new Error('Category already exists');
            error.statusCode = 400;
            throw error;
        }
        // create new category
        const category = await db.category.create({
            data: { name, slug, description, avatar }
        });
        return res.status(201).json({
            success: true,
            message: 'category created successfully',
            data: category
        });
    }
    catch (error) {
        next(error);
    }
};
// GET /category/all?search=el&suggestions=true
export const getAllCategories = async (req, res, next) => {
    try {
        const { search = "", page = "1", limit = "10", suggestions } = req.query;
        const pageNumber = parseInt(page) || 1;
        const pageSize = parseInt(limit) || 10;
        const skip = (pageNumber - 1) * pageSize;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }
        if (suggestions === "true") {
            // return only top 5 names for suggestions
            const suggestionResults = await db.category.findMany({
                where,
                include: { subcategories: true },
                take: 5,
                orderBy: { name: "asc" },
            });
            //console.log("search suggestions", suggestionResults)
            return res.status(200).json({ success: true, data: suggestionResults });
        }
        // Full search with pagination
        const total = await db.category.count({ where });
        const categories = await db.category.findMany({
            where,
            include: {
                subcategories: true,
                products: {
                    include: {
                        seller: true,
                        likes: true,
                        subCategory: true
                    }
                }
            },
            skip,
            take: pageSize,
            orderBy: { name: "asc" },
        });
        // console.log(categories)
        return res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            data: categories,
            meta: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
// get single category by slug
export const getCategoryBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const category = await db.category.findUnique({
            where: { slug },
            include: {
                subcategories: true,
                products: true,
            }
        });
        if (!category) {
            const error = new Error('Category not found');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json({
            success: true,
            message: 'category fetched successfully',
            data: category
        });
    }
    catch (error) {
        next(error);
    }
};
// delete category by slug
export const deleteCategoryBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const category = await db.category.delete({
            where: { slug }
        });
        if (!category) {
            const error = new Error('Category not found');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json({
            success: true,
            message: 'category deleted successfully',
            data: category
        });
    }
    catch (error) {
        next(error);
    }
};
// update category by slug
export const updateCategoryBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { name, description, avatar } = req.body;
        //slugify name
        const newSlug = slugify(name, { lower: true, strict: true });
        //check if category exists
        const existingCategory = await db.category.findUnique({
            where: { slug }
        });
        if (!existingCategory) {
            const error = new Error('Category not found');
            error.statusCode = 404;
            throw error;
        }
        //update category
        const updatedCategory = await db.category.update({
            where: { slug },
            data: { name, slug: newSlug, description, avatar }
        });
        return res.status(200).json({
            success: true,
            message: 'category updated successfully',
            data: updatedCategory
        });
    }
    catch (error) {
        next(error);
    }
};
//delete all categories (for testing purposes)
export const deleteAllCategories = async (req, res, next) => {
    try {
        await db.category.deleteMany();
        res.status(200).json({
            success: true,
            message: 'all categories deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
