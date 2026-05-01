import { Router } from 'express';
import { createProduct, deleteProductBySlug, getProductBySlug, getProductsBySubCategorySlug, searchProducts, trackProductView, updateProductStatusBySlug } from '../controllers/product.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { aiProductChat } from '../controllers/ai-product-chat.js';
const productRouter = Router();
// Get current user
productRouter.post('/post', authMiddleware, createProduct);
// get all products with search and suggestions
productRouter.get('/all', searchProducts);
productRouter.get('/subcategory/:slug', getProductsBySubCategorySlug);
// get products by slug
productRouter.get('/prodct-details/:slug', getProductBySlug);
// track product views
productRouter.post('/view/:slug', trackProductView);
// ai product chat
productRouter.post('/ai/product-chat', authMiddleware, aiProductChat);
// mark as sold route
productRouter.put(`/update-status/:slug`, authMiddleware, updateProductStatusBySlug);
// delete product by slug
productRouter.delete('/delete/:slug', authMiddleware, deleteProductBySlug);
export default productRouter;
