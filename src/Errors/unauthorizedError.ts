import { AppError } from "./appError";
import { StatusCodes } from "http-status-codes";

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized Access", details?: any) { // ✅ صححنا الكلمة
    super(message, StatusCodes.UNAUTHORIZED, details);
  }
}
