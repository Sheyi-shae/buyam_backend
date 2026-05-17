const isProd = process.env.NODE_ENV === "production";
const ACCESS_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
};
export function setAuthCookies(res, accessToken, refreshToken) {
    res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: ACCESS_TTL_MS,
    });
    res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: REFRESH_TTL_MS,
    });
}
export function clearAuthCookies(res) {
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
}
