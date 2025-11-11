import { Request } from "express";
import { Types } from "mongoose";

// ✅ تعريف نوع المستخدم الموحد
export interface AppUser {
  _id?: Types.ObjectId;     // ObjectId في قاعدة البيانات
  id?: string;              // نفس الـ _id كسلسلة نصية
  email?: string;
  name?: string;
  role?: "user" | "admin" | "SuperAdmin" | string; // جميع الأدوار المحتملة
  isSuperAdmin?: boolean;   // لو true يبقى معاه كل الصلاحيات
  isVerified?: boolean;
  customPermissions?: string[];
  rolePermissions?: string[];
}

// ✅ Extend Express Request مع نوع المستخدم الموحد
export interface AuthenticatedRequest extends Request {
  user?: AppUser;
}

// 🎯 توسيع Express Request العام
declare global {
  namespace Express {
    interface Request {
      user?: AppUser;
    }
  }
}

export {};
