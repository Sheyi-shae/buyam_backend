
import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import db from "../libs/db.js";
import { CustomError } from "../middleware/error-middleware.js";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies.js";
import { generateAccessToken, generateRefreshToken, hashToken, refreshExpiryDate } from "../utils/tokens.js";
import { sendEmail } from "../utils/resend-email-config.js";





export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user ;
    if (!user) return res.redirect(`${process.env.FRONTEND_URL}/signin&signup-auth/failure`);
     const redirectTo =
  typeof req.query.state === "string" &&
  req.query.state.startsWith("/")
    ? req.query.state
    : "/";
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();
  
    const tokenHash = hashToken(refreshToken);
    await db.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: refreshExpiryDate(),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    },
  });
    setAuthCookies(res, accessToken, refreshToken);
    

 
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
  //      if (user.email) {
  //           sendEmail({
  //   to: user.email,
  //   subject: 'New Login Detected',
  //   html: `
  //     <h3>New login to your account</h3>
  //     <p>If this was you, you can ignore this email.</p>
  //     <p>If not, secure your account immediately.</p>
  //   `,
  // }).catch(err => {
  //   console.error('Email failed:', err.message);
  // });
  //       }

  res.redirect(`${FRONTEND_URL}/signin&signup-auth/callback?redirectTo=${redirectTo}`);
  } catch (error) {
    console.error("Google callback error:", error);
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(400).json({ 
        ok: false, 
        message: "Invalid user" 
      });
      return;
    }

    const user = await db.user.findUnique({
      where: { id: Number(userId) },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        avatar: true, 
        role: true,
        publicId: true,
        online: true,
        lastSeen: true
      }
    });

    if (!user) {
      res.status(404).json({ 
        ok: false, 
        message: "User not found" 
      });
      return;
    }

    res.status(200).json({ 
      ok: true, 
      data: user 
    });

  } catch (error) {
    next(error);
  }
};

export const logout = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const hash = hashToken(token);
      await db.session.updateMany({
        where: { tokenHash: hash },
        data: { revoked: true },
      });
    }
    
    clearAuthCookies(res); 
    res.json({ ok: true, message: "Logged out successfully" });
  } catch(error) {
    next(error);
  }
};


// logout on all devices
export async function logoutAll(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    await db.session.updateMany({
      where: { userId: req.user?.id },
      data: { revoked: true },
    });
    clearAuthCookies(res);
    res.json({ ok: true, message: "Logged out of all devices" });
  } catch(error) {
    next(error);
  }
}

// refresh token controller

export async function refreshTokenHandler(req:Request, res:Response,next:NextFunction) {
  const token = req.cookies.refreshToken;
   
  try {
      if (!token) {
    const error = new Error('Refresh token required') as CustomError;
                error.statusCode = 401;
                throw error;
  }

  const tokenHash = hashToken(token);

 const session = await db.session.findFirst({
  where: {
    tokenHash,
    revoked: false,
    //userAgent: req.headers["user-agent"],
  },
});

  if (!session) {
    // possible token theft
     const error = new Error('Invalid refresh token') as CustomError;
                error.statusCode = 401;
                throw error;
  }

  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
     const error = new Error('Refresh  required') as CustomError;
                error.statusCode = 401;
                throw error;
    }
 



    // Prevents infinite refresh chains.
    const MAX_SESSION_DAYS = 30;
    if (
  session.createdAt <
  new Date(Date.now() - MAX_SESSION_DAYS * 86400000)
) {
  throw new Error("Session expired");
}
  const newRefreshToken = generateRefreshToken();
  const newHash = hashToken(newRefreshToken);

    //rotate token 
    await db.$transaction([
  db.session.update({
    where: { id: session.id },
    data: { revoked: true },
  }),
  db.session.create({
    data: {
      userId: session.userId,
      tokenHash: newHash,
      expiresAt: refreshExpiryDate(),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    },
  }),
]);
 

  const accessToken = generateAccessToken(session.userId);
  setAuthCookies(res, accessToken, newRefreshToken);

  res.json({ success: true });
    
  } catch (error) {
    next(error)
    
  }


}