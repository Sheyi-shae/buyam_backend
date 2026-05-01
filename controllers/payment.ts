// routes/payments.js
import axios from "axios";
import { NextFunction, Request, Response } from "express";
import db from "../libs/db.js";
import { CustomError } from "../middleware/error-middleware.js";

export const initializePayment = async (req:Request,res:Response,next:NextFunction) => {
  const { publicId } = req.body;
    const userId = req.user?.id;
      const amount = 2000 * 100; // ₦2000 in kobo
    const reference = `verify_${publicId}_${Date.now()}`;
    
// Get the authenticated user's data
const loggedinUser = await db.user.findUnique({ 
  where: { id: userId } // or however you map sub to user
});

if (!loggedinUser) {
   const error = new Error('User not found') as CustomError;
               error.statusCode = 404;
               throw error;
  }
  // check if user is already verified
  if (loggedinUser.verifiedSeller) {
    const error = new Error('User already verified') as CustomError;
               error.statusCode = 400;
               throw error;
  }

  // check if there's a pending payment
  const pendingPayment = await db.payment.findFirst({
    where: {
      userId,
      status: "PENDING",
    },
  });

  if (pendingPayment) {
    const error = new Error('Pending payment found') as CustomError;
               error.statusCode = 400;
               throw error;
  }

// Users should only be able to pay for themselves
if (req.body.publicId && req.body.publicId !== loggedinUser.publicId) {
  const error = new Error('Unauthorized') as CustomError;
               error.statusCode = 403;
               throw error;
}

    

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: loggedinUser?.email,
        amount,
        reference,
        callback_url: process.env.NEXT_PUBLIC_CALLBACK_URL,
        metadata: {
          publicId,
          userId,
          purpose: "VENDOR_VERIFICATION",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({data:response.data.data,amount}); // send payment URL to frontend
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Payment initialization failed" });
  }
}


//verify payment
export const verifyPayment = async (req:Request,res:Response,next:NextFunction) => {
  const { reference } = req.params;
  try {
    const { data } = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
      res.json(data);
      
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
}
