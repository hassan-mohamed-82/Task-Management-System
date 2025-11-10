import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

// 🧩 تعريف الـ interface وتصديره
export interface SuperAdminDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
}

const SuperAdminSchema = new Schema<SuperAdminDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "SuperAdmin", immutable: true },
  },
  { timestamps: true }
);

// 🔐 تشفير كلمة المرور قبل الحفظ
SuperAdminSchema.pre("save", async function (next) {
  const admin = this as SuperAdminDocument;

  if (!admin.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  admin.password = await bcrypt.hash(admin.password, salt);
  next();
});

export const SuperAdminModel = mongoose.model<SuperAdminDocument>(
  "SuperAdmin",
  SuperAdminSchema
);
