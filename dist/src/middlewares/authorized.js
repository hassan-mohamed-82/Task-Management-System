"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoleAtProject = exports.authorizeRoles = void 0;
const unauthorizedError_1 = require("../Errors/unauthorizedError");
const User_Project_1 = require("../models/schema/User_Project");
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        console.log("🔍 user from token:", req.user); // ✅ اطبع بيانات المستخدم
        console.log("🔍 allowed roles:", roles);
        if (!req.user?.role || !roles.includes(req.user.role)) {
            throw new unauthorizedError_1.UnauthorizedError(`Access denied for role: ${req.user?.role}`);
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
const authorizeRoleAtProject = (roles) => {
    return async (req, res, next) => {
        const userId = req.user?.id ?? req.body.userId;
        const projectId = req.params.project_id ?? req.body.project_id;
        // Super Admin على النظام يتخطى كل شيء
        if (req.user?.role === "SuperAdmin")
            return next();
        // Admin على مستوى النظام يسمح له على كل مشاريع العميل
        if (req.user?.role === "admin")
            return next();
        // التحقق من علاقة المستخدم بالمشروع
        const userProject = await User_Project_1.UserProjectModel.findOne({
            user_id: userId,
            project_id: projectId
        });
        if (!userProject)
            throw new unauthorizedError_1.UnauthorizedError("User is not a member of the project");
        // التحقق من الدور داخل المشروع
        if (!userProject.role || !roles.includes(userProject.role)) {
            throw new unauthorizedError_1.UnauthorizedError("You do not have permission for this action");
        }
        next();
    };
};
exports.authorizeRoleAtProject = authorizeRoleAtProject;
