"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProjectOrTaskRole = exports.authorizeRoles = void 0;
const unauthorizedError_1 = require("../Errors/unauthorizedError");
const User_Project_1 = require("../models/schema/User_Project");
const User_Task_1 = require("../models/schema/User_Task");
const mongoose_1 = __importDefault(require("mongoose"));
// Middleware للتحقق من صلاحيات عامة حسب الدور على النظام
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        const role = req.user?.role ?? "";
        if (!role || !roles.includes(role)) {
            throw new unauthorizedError_1.UnauthorizedError(`Access denied for role: ${req.user?.role}`);
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
const checkProjectOrTaskRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?._id || req.user?.id;
            const role = req.user?.role ?? "";
            if (!userId)
                throw new unauthorizedError_1.UnauthorizedError("Unauthorized");
            // Admin bypass
            if (role.toLowerCase() === "admin")
                return next();
            // Only user or admin
            if (role.toLowerCase() !== "user") {
                throw new unauthorizedError_1.UnauthorizedError("Only admin or user can access");
            }
            console.log("⚡ Route Params:", req.params);
            const { project_id, taskId } = req.params;
            let projectRole = null;
            let taskRole = null;
            // --------------------------
            // CHECK PROJECT ROLE
            // --------------------------
            if (project_id) {
                if (!mongoose_1.default.Types.ObjectId.isValid(project_id)) {
                    console.log("❌ Invalid project_id:", project_id);
                }
                else {
                    const userProject = await User_Project_1.UserProjectModel.findOne({
                        user_id: userId,
                        project_id: project_id,
                    });
                    if (!userProject) {
                        console.log("❌ No UserProject found for:", {
                            user_id: userId,
                            project_id,
                        });
                    }
                    else {
                        projectRole = userProject.role ?? null;
                    }
                }
            }
            // --------------------------
            // CHECK TASK ROLE
            // --------------------------
            if (taskId) {
                if (!mongoose_1.default.Types.ObjectId.isValid(taskId)) {
                    console.log("❌ Invalid taskId:", taskId);
                }
                else {
                    const userTask = await User_Task_1.UserTaskModel.findOne({
                        user_id: userId,
                        task_id: taskId,
                    });
                    if (!userTask) {
                        console.log("❌ No UserTask found for:", {
                            user_id: userId,
                            task_id: taskId,
                        });
                    }
                    else {
                        taskRole = userTask.role ?? null;
                    }
                }
            }
            // Allow endpoints without project or task
            if (!project_id && !taskId) {
                return next();
            }
            const allowedRolesLower = allowedRoles.map(r => r.toLowerCase());
            const isAllowed = (projectRole && allowedRolesLower.includes(projectRole.toLowerCase())) ||
                (taskRole && allowedRolesLower.includes(taskRole.toLowerCase()));
            // --------------------------
            // DEBUG
            // --------------------------
            console.log("🔍 Allowed roles:", allowedRolesLower);
            console.log("🔍 User projectRole:", projectRole);
            console.log("🔍 User taskRole:", taskRole);
            console.log("🔍 isAllowed:", isAllowed);
            if (!isAllowed) {
                throw new unauthorizedError_1.UnauthorizedError(`Access denied. Allowed roles: ${allowedRoles.join(", ")}`);
            }
            res.locals.userProjectRole = projectRole;
            res.locals.userTaskRole = taskRole;
            next();
        }
        catch (err) {
            next(err);
        }
    };
};
exports.checkProjectOrTaskRole = checkProjectOrTaskRole;
