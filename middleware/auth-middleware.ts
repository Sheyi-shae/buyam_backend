import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { CustomError } from "./error-middleware.js";
import db from "../libs/db.js";

export interface AuthenticatedUser {
  id: number;
  email: string | null;
  name: string | null;
  avatar: string | null;
  publicId:string 
  role: string;
}
// Extend Express Request to carry the hydrated user
declare global {
  namespace Express {
    interface Request {
      user?:User;
    }
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ERROR_MESSAGES = {
  NO_TOKEN: "Authorization token required",
  INVALID_TOKEN: "Invalid or expired token",
  TOKEN_REVOKED: "Token has been revoked",
  INVALID_USER: "User not found",
  ACCOUNT_BANNED: "Account suspended",
  ADMIN_REQUIRED: "Admin access required",
  REFRESH_REQUIRED: "Access token expired — refresh required",
} as const;

const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
} as const;


// ─── Helpers ──────────────────────────────────────────────────────────────────

const createError = (message: string, statusCode: number): CustomError => {
  const error = new Error(message) as CustomError;
  error.statusCode = statusCode;
  return error;
};





// Auth Middleware

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
  const token = req.cookies.accessToken;

    if (!token) {
      throw createError(ERROR_MESSAGES.NO_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
       if (!decoded.sub) {
      throw createError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }
      const user = await db.user.findUnique({
      where: { id: Number(decoded.sub)  },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        publicId:true

      },
    });

    
    if (!user) {
      throw createError(ERROR_MESSAGES.INVALID_USER, HTTP_STATUS.UNAUTHORIZED);
      }
    req.user = user;
   

    next();
  } catch (error) {
    next(error);
  }
};



// ─── Role Middleware ──────────────────────────────────────────────────────────


export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next(createError(ERROR_MESSAGES.INVALID_USER, HTTP_STATUS.UNAUTHORIZED));
    return;
  }

  if (req.user.role !== "ADMIN") {
    next(createError(ERROR_MESSAGES.ADMIN_REQUIRED, HTTP_STATUS.FORBIDDEN));
    return;
  }

  next();
};


// ─── Composed Middleware Chains ──────────────────────────────────────────────
export const requireAuth = [authMiddleware];
export const requireAdmin = [authMiddleware, adminMiddleware];