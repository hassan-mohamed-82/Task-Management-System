import { Request } from "express";
import { Types } from "mongoose";

// تعريف نوع المستخدم الموحد (User + Admin + SuperAdmin)
export interface AppUser {
  _id?: Types.ObjectId;     // ObjectId في قاعدة البيانات
  id?: string;              // نفس الـ _id لكن كسلسلة نصية
  email?: string;
  name?: string;
  role?: "viewer" | "member" | "admin" | "super-admin" | string; // جميع الأدوار المحتملة
  isSuperAdmin?: boolean;   // لو true يبقى معاه كل الصلاحيات
  isVerified?: boolean;
  customPermissions?: string[];
  rolePermissions?: string[];
}

// Extend Express Request with your custom user type
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
