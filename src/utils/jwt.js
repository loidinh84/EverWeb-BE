import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET;

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export const generateResetToken = (payload) => {
  return jwt.sign(payload, JWT_RESET_SECRET, { expiresIn: "15m" });
};

export const verifyResetToken = (token) => {
  return jwt.verify(token, JWT_RESET_SECRET);
};
