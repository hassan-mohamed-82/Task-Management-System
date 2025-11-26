import { NextFunction, Request, Response, RequestHandler } from "express";
import { UnauthorizedError } from "../Errors/unauthorizedError";
import { UserProjectModel } from "../models/schema/User_Project";
import { UserTaskModel } from "../models/schema/User_Task";
import mongoose from "mongoose";
import { NotFound } from "../Errors";

// Middleware للتحقق من صلاحيات عامة حسب الدور على النظام
export const authorizeRoles = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role ?? "";
    if (!role || !roles.includes(role)) {
      throw new UnauthorizedError(`Access denied for role: ${req.user?.role}`);
    }
    next();
  };
};

export const checkProjectOrTaskRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id || req.user?.id;
      const globalRole = (req.user?.role || "").toLowerCase();

      if (!userId) throw new UnauthorizedError("Unauthorized");

      // Admin bypass
      if (globalRole === "admin") return next();

      if (globalRole !== "user") {
        throw new UnauthorizedError("Only user or admin can access");
      }

      const { project_id, taskId } = req.params;

      let projectRole: string | null = null;
      let taskRole: string | null = null;

      // ---------------- Project Role ----------------
      if (project_id && mongoose.Types.ObjectId.isValid(project_id)) {
        const userProject = await UserProjectModel.findOne({
          user_id: userId,
          project_id: project_id,
        });

        if (!userProject) {
          throw new NotFound("User is not part of this project");
        }

        projectRole = (userProject.role || "").toLowerCase();
      }

      // ---------------- Task Role ----------------
      if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
        const userTask = await UserTaskModel.findOne({
          user_id: userId,
          task_id: taskId,
        });

        if (!userTask) {
          throw new NotFound("User is not part of this task");
        }

        taskRole = (userTask.role || "").toLowerCase();
      }

      if (!project_id && !taskId) return next();

      const allowedRolesLower = allowedRoles.map(r => r.toLowerCase());

      const isAllowed =
        (projectRole && allowedRolesLower.includes(projectRole)) ||
        (taskRole && allowedRolesLower.includes(taskRole));

      if (!isAllowed) {
        throw new UnauthorizedError(
          `Access denied. Allowed roles: ${allowedRoles.join(", ")}`
        );
      }

      res.locals.userProjectRole = projectRole;
      res.locals.userTaskRole = taskRole;

      next();
    } catch (err
    ) {
      next(err);
    }
  };
};