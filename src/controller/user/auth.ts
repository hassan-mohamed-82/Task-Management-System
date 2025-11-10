import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import mongoose, { Types } from "mongoose";


import { saveBase64Image } from "../../utils/handleImages";
import { sendEmail } from "../../utils/sendEmails";
import { generateToken } from "../../utils/auth";
import { SuccessResponse } from "../../utils/response";

import { User } from "../../models/schema/auth/User";
import { EmailVerificationModel } from "../../models/schema/auth/emailVerifications";

import {
  ForbiddenError,
  NotFound,
  UnauthorizedError,
  UniqueConstrainError,
} from "../../Errors";
import { AuthenticatedRequest } from "../../types/custom";
import { BadRequest } from "../../Errors/BadRequest";


// ------------------------------------
// 🔹 Helper function: send verification email
// ------------------------------------
const sendVerificationCode = async (userId: Types.ObjectId, email: string, name: string, subject: string, messageTitle: string) => {
  const code = randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // ساعتين

  await EmailVerificationModel.deleteMany({ userId });
  await EmailVerificationModel.create({ userId, verificationCode: code, expiresAt });

  await sendEmail(
    email,
    subject,
    `Hello ${name},

${messageTitle}
Your verification code is: ${code}
(This code is valid for 2 hours)

Best regards,
Smart College Team`
  );

  return code;
};

// ------------------------------------
// 🧾 Signup
// ------------------------------------
export const signup = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new UniqueConstrainError("Email", "User already signed up with this email");

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    isVerified: false,
  });

await sendVerificationCode(
  new mongoose.Types.ObjectId(newUser._id),
  newUser.email,
  newUser.name,
  "Verify Your Email",
  "We received a request to verify your Smart College account."
);

  return SuccessResponse(res, { message: "Signup successful, check your email for code", userId: newUser._id }, 201);
};

// ------------------------------------
// ✅ Verify Email
// ------------------------------------
export const verifyEmail = async (req: Request, res: Response) => {
  const { userId, code } = req.body;

  if (!userId || !code) throw new BadRequest("userId and code are required");

  const record = await EmailVerificationModel.findOne({ userId });
  if (!record) throw new BadRequest("No verification record found");
  if (record.verificationCode !== code) throw new BadRequest("Invalid verification code");
  if (record.expiresAt < new Date()) throw new BadRequest("Verification code expired");

  await User.findByIdAndUpdate(userId, { isVerified: true });
  await EmailVerificationModel.deleteOne({ userId });

  return SuccessResponse(res, { message: "Email verified successfully" });
};

// ------------------------------------
// 🔐 Login
// ------------------------------------
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw new BadRequest("Email and password are required");

  const user = await User.findOne({ email });
  if (!user || !user.password) throw new UnauthorizedError("Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new UnauthorizedError("Invalid email or password");

  if (!user.isVerified) throw new ForbiddenError("Verify your email first");

  const token = generateToken({ id: user._id.toString(), name: user.name });
  return SuccessResponse(res, { message: "Login successful", token, userId: user._id, role: user.role, name: user.name }, 200);
};



// ------------------------------------
// 🔁 Send Reset Code
// ------------------------------------
export const sendResetCode = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new NotFound("User not found");
  if (!user.isVerified) throw new BadRequest("User is not verified");

  const code = randomInt(100000, 999999).toString();

  // حذف أي كود موجود مسبقًا
  await EmailVerificationModel.deleteMany({ userId: user._id });

  // إنشاء كود جديد
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // ساعتين
  await EmailVerificationModel.create({
    userId: user._id,
    verificationCode: code,
    expiresAt,
  });

  await sendEmail(
    email,
    "Reset Password Code",
    `Hello ${user.name},

Your password reset code is: ${code}
(This code is valid for 2 hours)

Best regards,
Smart College Team`
  );

  SuccessResponse(res, { message: "Reset code sent to your email" }, 200);
};

export const verifyResetCode = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new NotFound("User not found");

  const userId = user._id;
  const record = await EmailVerificationModel.findOne({ userId});
  if (!record) throw new BadRequest("No reset code found");

  if (record.verificationCode !== code) throw new BadRequest("Invalid code");

  if (record.expiresAt < new Date()) throw new BadRequest("Code expired");


  SuccessResponse(res, { message: "Reset code verified successfully" }, 200);
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new NotFound("User not found");

  const record = await EmailVerificationModel.findOne({ userId: user._id });
  if (!record) throw new BadRequest("No reset code found");

  // تحديث الباسورد
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  // حذف سجل التحقق
  await EmailVerificationModel.deleteOne({ userId: user._id });

  // توليد التوكن
  const token = generateToken({
    id: user._id,
    name: user.name,
  });

  // إرسال الرد مع التوكن
  return SuccessResponse(res, { message: "Password reset successful", token }, 200);
};
