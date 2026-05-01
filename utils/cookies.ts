import { Response } from "express";

const isProd = process.env.NODE_ENV === "production";
const ACCESS_TTL_MS = 1 * 60 * 1000;           // 15 minutes
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
} as const;

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {

  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TTL_MS,
  });

  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    sameSite: "strict",
    path: "/",
    maxAge: REFRESH_TTL_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("accessToken", {
    ...baseCookieOptions,
    sameSite: "lax",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    ...baseCookieOptions,
    sameSite: "strict",
    path: "/",
  });
}