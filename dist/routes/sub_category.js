import { Router } from 'express';
import { adminMiddleware, authMiddleware, requireAdmin } from '../middleware/auth-middleware.js';
import { createSubCategory, deleteAllSubCategories, deleteSubCategoryBySlug, editSubCategoryBySlug, getAllSubCategories, getSubCategoryBySlug } from '../controllers/sub_category.js';
const subCategoryRouter = Router();
// create category - admin only
subCategoryRouter.post('/', requireAdmin, createSubCategory);
//get all categories admin only
subCategoryRouter.get('/all', requireAdmin, getAllSubCategories);
//get categories - public
subCategoryRouter.get('/', getAllSubCategories);
//get category details by slug admin
subCategoryRouter.get('/:slug/admin', authMiddleware, adminMiddleware, getSubCategoryBySlug);
//get category details by slug
subCategoryRouter.get('/:slug', getSubCategoryBySlug);
//update category by slug - admin only
subCategoryRouter.put('/:slug', authMiddleware, adminMiddleware, editSubCategoryBySlug);
//delete category by slug - admin only
subCategoryRouter.delete('/:slug', authMiddleware, adminMiddleware, deleteSubCategoryBySlug);
//delete all categories by slug - admin only
subCategoryRouter.delete('/all/:slug', authMiddleware, adminMiddleware, deleteAllSubCategories);
export default subCategoryRouter;
