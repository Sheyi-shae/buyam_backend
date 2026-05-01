import { Router } from 'express';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { initializePayment, verifyPayment } from '../controllers/payment.js';

const paymentRouter = Router();

// initialize payment
paymentRouter.post('/initialize', authMiddleware, initializePayment)
// verify payment
paymentRouter.get('/verify/:reference', authMiddleware, verifyPayment)

export default paymentRouter;