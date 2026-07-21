import jwt from "jsonwebtoken";

export function extractToken(req) {
  let token = req.cookies?.token;
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!token && authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }
  return token;
}

export const generateToken = (userId, extraClaims = {}) => {
  return jwt.sign({ id: userId, ...extraClaims }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

export const sendTokenCookie = (res, token) => {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_URL);

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "lax" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearTokenCookie = (res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
};
