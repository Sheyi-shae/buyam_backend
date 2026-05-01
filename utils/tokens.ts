import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_TTL = 1 * 60 * 1000
const REFRESH_DAYS = 7 * 24 * 60 * 60 * 1000

export function generateAccessToken(userId:number) {
  return jwt.sign(
    { sub: userId , type: "access"},
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TTL }
  );
}

export function generateRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}

export function hashToken(token:string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshExpiryDate(): Date {
  return new Date(Date.now() + REFRESH_DAYS );
}