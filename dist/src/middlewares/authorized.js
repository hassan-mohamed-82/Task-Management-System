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
const Errors_1 = require("../Errors");
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
            const globalRole = req.user?.role?.toLowerCase() || "";
            if (!userId)
                throw new unauthorizedError_1.UnauthorizedError("Unauthorized");
            // Admin bypass
            if (globalRole === "admin")
                return next();
            if (globalRole !== "user") {
                throw new unauthorizedError_1.UnauthorizedError("Only user or admin can access");
            }
            const { project_id, taskId } = req.params;
            let projectRole = null;
            let taskRole = null;
            // --------------------------
            // Check Project role
            // --------------------------
            if (project_id && mongoose_1.default.Types.ObjectId.isValid(project_id)) {
                let userProject = await User_Project_1.UserProjectModel.findOne({
                    user_id: userId,
                    project_id,
                });
                // If user is not officially part of the project,
                // allow access if they have a task inside the project
                if (!userProject) {
                    const taskInsideProject = await User_Task_1.UserTaskModel.findOne({
                        user_id: userId,
                        project_id,
                    });
                    if (!taskInsideProject) {
                        throw new Errors_1.NotFound("User is not part of this project");
                    }
                    projectRole = taskInsideProject.role ?? null;
                }
                else {
                    projectRole = userProject.role ?? null;
                }
            }
            // --------------------------
            // Check Task role
            // --------------------------
            if (taskId && mongoose_1.default.Types.ObjectId.isValid(taskId)) {
                const userTask = await User_Task_1.UserTaskModel.findOne({
                    user_id: userId, // fixed bug
                    task_id: taskId,
                });
                if (!userTask) {
                    throw new Errors_1.NotFound("User is not part of this task");
                }
                taskRole = userTask.role ?? null;
            }
            if (!project_id && !taskId)
                return next();
            const allowedRolesLower = allowedRoles.map(r => r.toLowerCase());
            const isAllowed = (projectRole && allowedRolesLower.includes(projectRole.toLowerCase())) ||
                (taskRole && allowedRolesLower.includes(taskRole.toLowerCase()));
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
