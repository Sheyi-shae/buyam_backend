import { Router } from 'express';
import { adminMiddleware, authMiddleware, requireAdmin } from '../middleware/auth-middleware.js';
import { createCategory, deleteAllCategories, deleteCategoryBySlug, getAllCategories, getCategoryBySlug, updateCategoryBySlug } from '../controllers/category.js';

const categoryRouter = Router();

// create category - admin only
categoryRouter.post('/', requireAdmin, createCategory)
//get all categories admin only
categoryRouter.get('/all', requireAdmin, getAllCategories)
categoryRouter.get('/all-category', authMiddleware,getAllCategories)
//get categories - public
categoryRouter.get('/', getAllCategories)
//get category details by slug admin
categoryRouter.get('/:slug/admin', authMiddleware, adminMiddleware, getCategoryBySlug)
//get category details by slug
categoryRouter.get('/:slug', getCategoryBySlug)
//update category by slug - admin only
categoryRouter.put('/:slug', authMiddleware, adminMiddleware, updateCategoryBySlug)
//delete category by slug - admin only
categoryRouter.delete('/:slug', authMiddleware, adminMiddleware, deleteCategoryBySlug)

//delete all categories by slug - admin only
categoryRouter.delete('/all/:slug', authMiddleware, adminMiddleware, deleteAllCategories)

export default categoryRouter;