import  express,{ Router } from 'express';
import { paystackWebhook } from '../controllers/paystack-webhook.js';

const webhookRouter = Router();

// initialize payment webook
webhookRouter.post(
  "/paystack", 
  express.raw({ type: 'application/json' }), 
  paystackWebhook
);


export default webhookRouter;

