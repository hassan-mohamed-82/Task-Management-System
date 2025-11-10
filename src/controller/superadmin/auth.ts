import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { BadRequest } from "../../Errors/BadRequest";
import { UnauthorizedError } from "../../Errors";
import { SuperAdminModel } from "../../models/schema/auth/SuperAdmin";
import type { SuperAdminDocument } from "../../models/schema/auth/SuperAdmin"; // ✅ أضف ده
import { generateToken } from "../../utils/auth";
import { SuccessResponse } from "../../utils/response";
import { Types } from "mongoose";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequest("Email and password are required");
  }

  // ✅ استخدم النوع الصح هنا
  const user: SuperAdminDocument | null = await SuperAdminModel.findOne({ email });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = generateToken({
    id: (user._id as Types.ObjectId).toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: true,
  });

  return SuccessResponse(
    res,
    {
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    200
  );
};
