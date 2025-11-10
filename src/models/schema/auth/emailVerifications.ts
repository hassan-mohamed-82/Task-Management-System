import mongoose, { Types } from 'mongoose';
import { IUser } from './User';

interface EmailVerificationDocument extends mongoose.Document {
  userId: Types.ObjectId;
  verificationCode: string;
  expiresAt: Date;
}
const EmailVerificationSchema = new mongoose.Schema<EmailVerificationDocument>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "IUser", required: true },
    verificationCode: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const EmailVerificationModel = mongoose.model<EmailVerificationDocument>("EmailVerification", EmailVerificationSchema);
