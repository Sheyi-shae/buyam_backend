import { NextFunction, Request, Response } from "express";
import { buildProductSnapshot } from "../ai-functions/product-snapshot.js";
import db from "../libs/db.js";
import { buildVendorSnapshot } from "../ai-functions/vendor-snapshot.js";
import { askProductAdvisor } from "../services/ai-service.js";
import { buildReviewStats } from "../ai-functions/build-reveiw-stats.js";
import { buildReviewSummary } from "../ai-functions/build-review-summary.js";

// routes/aiProductChat.js
export const aiProductChat = async (req: Request, res: Response, next: NextFunction) => {
  const { productId, message } = req.body;

  if (!message || message.length > 200) {
    return res.status(400).json({ message: "Invalid message" });
  }

  // basic keyword guard
  if (/scam|fraud|fake|illegal/i.test(message)) {
    return res.json({
      reply:
        "I can’t judge fraud, but I can explain the seller’s reviews, verification status, and what you should confirm before buying."
    });
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      subCategory: true,
      seller: {
        
              include: {
              reviews: true,
                
              
        }
  
    } }
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const productSnap = buildProductSnapshot(product);
  const vendorSnap = buildVendorSnapshot(product.seller,product.seller.reviews);
  const reviewStats = buildReviewStats(product.seller.reviews);
  const reviewSummary = buildReviewSummary(reviewStats);

  const reply = await askProductAdvisor({
    product: productSnap,
    vendor: vendorSnap,
    images: product.avatar,
    reviewSummary,
    userMessage: message
  });

  console.log(reply)

  res.json({ reply });

}
