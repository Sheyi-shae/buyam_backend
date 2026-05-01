import { Router } from "express";
import passport from "../config/passport.js";
import rateLimit from "express-rate-limit";
import { googleCallback, getCurrentUser, logout, refreshTokenHandler } from "../controllers/auth.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
const authRouter = Router();
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { ok: false, message: "Too many requests, slow down" },
    standardHeaders: true,
    legacyHeaders: false,
});
// authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"], },));
authRouter.get("/google", (req, res, next) => {
    const redirectTo = req.query.redirectTo || "/";
    passport.authenticate("google", {
        scope: ["profile", "email"],
        state: encodeURIComponent(redirectTo), // encode and send
    })(req, res, next);
});
authRouter.get("/google/callback", passport.authenticate("google", { session: false }), googleCallback);
// Session management  
authRouter.post("/refresh", authLimiter, refreshTokenHandler);
authRouter.post("/logout", authMiddleware, logout);
//authRouter.post("/logout-all", authMiddleware, logoutAll);
// User
authRouter.get("/me", authMiddleware, getCurrentUser);
export default authRouter;
