import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UnauthorizedError } from "../Errors";

dotenv.config();

interface AuthPayload {
  _id?: string;
  id?: string;
  name: string;
  role?: string;
  email?: string;
  isVerified?: boolean;
}

// 🎯 توليد التوكن (لأي نوع مستخدم)
export const generateToken = (user: AuthPayload): string => {
  return jwt.sign(
    {
      id: user._id?.toString() || user.id?.toString(),
      name: user.name,
      role: user.role || "user", // افتراضي لو مش محدد
      email: user.email,
      isVerified: user.isVerified ?? true, // الافتراضي أنه متحقق
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
};

// 🎯 التحقق من التوكن (يرجع بيانات المستخدم)
export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as jwt.JwtPayload;

    return {
      id: decoded.id as string,
      name: decoded.name as string,
      role: decoded.role as string,
      email: decoded.email as string,
      isVerified: decoded.isVerified as boolean,
    };
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired token");
  }
};
