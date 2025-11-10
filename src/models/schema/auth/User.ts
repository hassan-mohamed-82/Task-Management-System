import { Schema, model, Document } from 'mongoose';

export type UserRole = 'admin' | 'user';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  googleId?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },

    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    googleId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
