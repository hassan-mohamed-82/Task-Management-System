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

export const generateToken = (user: AuthPayload): string => {
  return jwt.sign(
    {
      id: user._id?.toString() || user.id?.toString(),
      name: user.name,
      role: user.role || "user",
      email: user.email,
      isVerified: user.isVerified ?? true,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
};

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
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
