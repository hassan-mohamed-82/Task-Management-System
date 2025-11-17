
import mongoose from "mongoose";
import { Request, Response } from "express";
import { ProjectModel } from "../../models/schema/project";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";
import { UserProjectModel } from "../../models/schema/User_Project";
import { User } from "../../models/schema/auth/User";
import { TaskModel } from "../../models/schema/Tasks";
import { UserTaskModel } from "../../models/schema/User_Task";

export const getUserTasksByProject = async (req: Request, res: Response) => {
  const userId = req.user?._id; // _id من الـ user
  const { project_id } = req.params;

  if (!userId || !project_id) throw new BadRequest("User ID or Project ID missing");

  // التأكد أن المستخدم عضو في المشروع
  const userProject = await UserProjectModel.findOne({ userId, project_id });
  if (!userProject) throw new NotFound("User is not part of this project");

  // جلب كل المهام الخاصة بالمستخدم في المشروع
  const tasks = await UserTaskModel.find({ userId })
    .populate({
      path: "task_id",
      match: { projectId: project_id } // فلترة على المشروع (Task يحتوي على projectId)
    });

  // فلترة المهام اللي موجودة فقط ضمن المشروع
  const userTasks = tasks.filter(t => t.task_id !== null);

  SuccessResponse(res, { message: "User tasks fetched successfully", userTasks });
};

export const updateUserTaskStatus = async (req: Request, res: Response) => {
  const userId = req.user?._id; // استخدم _id من الـ user
  const { taskId } = req.params;
  const { status } = req.body;

  if (!userId || !taskId || !status) throw new BadRequest("Missing required fields");

  const userTask = await UserTaskModel.findOne({ task_id: taskId, userId });
  if (!userTask) throw new NotFound("Task not found");

  // السماح فقط بتغيير الحالة خطوة خطوة: pending → in_progress → done
  const allowedTransitions: Record<string, string> = {
    pending: "in_progress",
    in_progress: "done"
  };

  if (!userTask.status || ["done", "Approved", "rejected"].includes(userTask.status)) {
    throw new BadRequest("Cannot change status of tasks that are done, Approved or Rejected");
  }

  if (allowedTransitions[userTask.status as keyof typeof allowedTransitions] !== status) {
    throw new BadRequest(`Invalid status transition. You can only move from ${userTask.status} to ${allowedTransitions[userTask.status as keyof typeof allowedTransitions]}`);
  }

  userTask.status = status;
  await userTask.save();

  SuccessResponse(res, { message: `Task status updated to ${status}`, userTask });
};

export const getMyTasks = async (req: Request, res: Response) => {
  const userId = req.user?._id;

  const tasks = await UserTaskModel.find({ userId })
    .populate({
      path: "task_id",
      select: "name description priority status projectId",
      populate: {
        path: "projectId",
        select: "name description" // أي حقول عايز تظهر من المشروع
      }
    });

  SuccessResponse(res, {
    message: "User tasks",
    tasks
  });
};


export const requestTaskApproval = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { taskId } = req.params;

  if (!userId || !taskId) throw new BadRequest("Missing required fields");

  const userTask = await UserTaskModel.findOne({ task_id: taskId, userId });
  if (!userTask) throw new NotFound("Task not found");

  if (userTask.status !== "done") {
    throw new BadRequest("You must complete the task before requesting approval");
  }

  userTask.status = "Pending_Approval";
  await userTask.save();

  SuccessResponse(res, {
    message: "Task approval request sent to admin",
    userTask
  });
};

