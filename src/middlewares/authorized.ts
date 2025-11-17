import { NextFunction, Request, Response, RequestHandler } from "express";
import { UnauthorizedError } from "../Errors/unauthorizedError";
import { BadRequest } from "../Errors/BadRequest";
import { UserProjectModel } from "../models/schema/User_Project";

export const authorizeRoles = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log("🔍 user from token:", req.user); // ✅ اطبع بيانات المستخدم
    console.log("🔍 allowed roles:", roles);

    if (!req.user?.role || !roles.includes(req.user.role)) {
      throw new UnauthorizedError(`Access denied for role: ${req.user?.role}`);
    }
    next();
  };
};


export const authorizeRoleAtProject = (roles: string[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id ?? req.body.userId;
const projectId = req.params.project_id ?? req.body.project_id;

    // Super Admin على النظام يتخطى كل شيء
    if (req.user?.role === "SuperAdmin") return next();

    // Admin على مستوى النظام يسمح له على كل مشاريع العميل
    if (req.user?.role === "admin") return next();

    // التحقق من علاقة المستخدم بالمشروع
    const userProject = await UserProjectModel.findOne({
      user_id: userId,
      project_id: projectId
    });

    if (!userProject) throw new UnauthorizedError("User is not a member of the project");

    // التحقق من الدور داخل المشروع
    if (!userProject.role || !roles.includes(userProject.role)) {
      throw new UnauthorizedError("You do not have permission for this action");
    }

    next();
  };
};
