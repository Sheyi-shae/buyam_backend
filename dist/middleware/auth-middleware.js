import jwt from "jsonwebtoken";
import db from "../libs/db.js";
// ─── Constants ────────────────────────────────────────────────────────────────
const ERROR_MESSAGES = {
    NO_TOKEN: "Authorization token required",
    INVALID_TOKEN: "Invalid or expired token",
    TOKEN_REVOKED: "Token has been revoked",
    INVALID_USER: "User not found",
    ACCOUNT_BANNED: "Account suspended",
    ADMIN_REQUIRED: "Admin access required",
    REFRESH_REQUIRED: "Access token expired — refresh required",
};
const HTTP_STATUS = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
};
// ─── Helpers ──────────────────────────────────────────────────────────────────
const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};
// Auth Middleware
export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            throw createError(ERROR_MESSAGES.NO_TOKEN, HTTP_STATUS.UNAUTHORIZED);
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.sub) {
            throw createError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
        }
        const user = await db.user.findUnique({
            where: { id: Number(decoded.sub) },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                publicId: true
            },
        });
        if (!user) {
            throw createError(ERROR_MESSAGES.INVALID_USER, HTTP_STATUS.UNAUTHORIZED);
        }
        req.user = user;
        console.log(user, "user");
        next();
    }
    catch (error) {
        next(error);
    }
};
// ─── Role Middleware ──────────────────────────────────────────────────────────
export const adminMiddleware = (req, res, next) => {
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
