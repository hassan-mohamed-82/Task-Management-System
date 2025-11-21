import { NextFunction, Request, Response, RequestHandler } from "express";
import { UnauthorizedError } from "../Errors/unauthorizedError";
import { UserProjectModel } from "../models/schema/User_Project";
import { UserTaskModel } from "../models/schema/User_Task";
import mongoose from "mongoose";

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
      const role = req.user?.role ?? "";

      if (!userId) throw new UnauthorizedError("Unauthorized");

      // Admin bypass
      if (role.toLowerCase() === "admin") return next();

      // Only user or admin
      if (role.toLowerCase() !== "user") {
        throw new UnauthorizedError("Only admin or user can access");
      }

      console.log("⚡ Route Params:", req.params);

      const { project_id, taskId } = req.params;
      let projectRole: string | null = null;
      let taskRole: string | null = null;

      // --------------------------
      // CHECK PROJECT ROLE
      // --------------------------
      if (project_id) {
        if (!mongoose.Types.ObjectId.isValid(project_id)) {
          console.log("❌ Invalid project_id:", project_id);
        } else {
          const userProject = await UserProjectModel.findOne({
            user_id: userId,
            project_id: project_id,
          });

          if (!userProject) {
            console.log("❌ No UserProject found for:", {
              user_id: userId,
              project_id,
            });
          } else {
            projectRole = userProject.role ?? null;
          }
        }
      }

      // --------------------------
      // CHECK TASK ROLE
      // --------------------------
      if (taskId) {
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
          console.log("❌ Invalid taskId:", taskId);
        } else {
          const userTask = await UserTaskModel.findOne({
            user_id: userId,
            task_id: taskId,
          });

          if (!userTask) {
            console.log("❌ No UserTask found for:", {
              user_id: userId,
              task_id: taskId,
            });
          } else {
            taskRole = userTask.role ?? null;
          }
        }
      }

      // Allow endpoints without project or task
      if (!project_id && !taskId) {
        return next();
      }

      const allowedRolesLower = allowedRoles.map(r => r.toLowerCase());

      const isAllowed =
        (projectRole && allowedRolesLower.includes(projectRole.toLowerCase())) ||
        (taskRole && allowedRolesLower.includes(taskRole.toLowerCase()));

      // --------------------------
      // DEBUG
      // --------------------------
      console.log("🔍 Allowed roles:", allowedRolesLower);
      console.log("🔍 User projectRole:", projectRole);
      console.log("🔍 User taskRole:", taskRole);
      console.log("🔍 isAllowed:", isAllowed);

      if (!isAllowed) {
        throw new UnauthorizedError(
          `Access denied. Allowed roles: ${allowedRoles.join(", ")}`
        );
      }

      res.locals.userProjectRole = projectRole;
      res.locals.userTaskRole = taskRole;

      next();
    } catch (err) {
      next(err);
    }
  };
};
