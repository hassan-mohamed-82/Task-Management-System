import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";
import { UnauthorizedError } from "../Errors/unauthorizedError";
import { Types } from "mongoose";

export function authenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authorization token missing or invalid");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token) as { id: string, role: string, email: string };

req.user = {
  _id: new Types.ObjectId(decoded.id),
  role: decoded.role,
  email: decoded.email
};

    next();
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired token");
  }
}   