import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../../models/schema/Tasks';
import { ProjectModel } from '../../models/schema/project';
import { BadRequest } from '../../Errors/BadRequest';
import { NotFound } from '../../Errors/NotFound';
import { UnauthorizedError } from '../../Errors/unauthorizedError';
import { SuccessResponse } from '../../utils/response';
import { User } from '../../models/schema/auth/User';
import {UserProjectModel} from '../../models/schema/User_Project';
import { UserTaskModel } from '../../models/schema/User_Task';

export const addUserTask = async (req: Request, res: Response) => {
    const { taskId, user_id } = req.body;

    if (!taskId || !user_id) {
        throw new BadRequest("Missing required fields");
    }

    const task = await TaskModel.findById(taskId);
    if (!task) {
        throw new NotFound("Task not found");
    }

    const user = await User.findById(user_id);
    if (!user) {
        throw new NotFound("User not found");
    }

    const project = await ProjectModel.findById(task.projectId);
    if (!project) {
        throw new NotFound("Project not found");
    }

    // التأكد أن اليوزر موجود في المشروع
const userProject = await UserProjectModel.findOne({ 
  userId: user_id, 
  project_id: project._id 
});

    if (!userProject) {
        throw new UnauthorizedError("User is not a member of the project");
    }

  const userTask = await UserTaskModel.create({
    userId: user_id,  // صحح الاسم هنا
    task_id: task._id,
    status: "pending" // default status
});
    SuccessResponse(res, { message: "User added to task successfully", userTask });
};

export const removeUserFromTask = async (req: Request, res: Response) => {
    const { taskId, user_id } = req.params;

    if (!taskId || !user_id) {
        throw new BadRequest("Missing required fields");
    }

    const task = await TaskModel.findById(taskId);
    if (!task) {
        throw new NotFound("Task not found");
    }

    const user = await User.findById(user_id);
    if (!user) {
        throw new NotFound("User not found");
    }

    const project = await ProjectModel.findById(task.projectId);
    if (!project) {
        throw new NotFound("Project not found");
    }

    // التأكد أن اليوزر موجود في المشروع
    const userProject = await UserProjectModel.findOne({ user_id, projectId: project._id });
    if (!userProject) {
        throw new UnauthorizedError("User is not a member of the project");
    }

    const userTask = await UserTaskModel.findOneAndDelete({ user_id, task_id: task._id });
    if (!userTask) {
        throw new NotFound("User not found in task");
    }

    SuccessResponse(res, { message: "User removed from task successfully", userTask });
};

export const getalluserattask = async (req: Request, res: Response) => {
    const { taskId } = req.params;
    if (!taskId) throw new BadRequest("Task ID is required");

    const task = await TaskModel.findById(taskId);
    if (!task) throw new NotFound("Task not found");

    // صححت الاسم هنا
    const userTasks = await UserTaskModel.find({ task_id: task._id })
        .populate("userId", "name email photo");

    SuccessResponse(res, { message: "Users fetched successfully", userTasks });
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  const { taskId, userId } = req.params;
  const { status, rejection_reason } = req.body;

  const userTask = await UserTaskModel.findOne({
    task_id: taskId,
    user_id: userId
  });

  if (!userTask) throw new NotFound("User task not found");

  // لازم تكون الحالة الحالية done علشان approve أو reject
  if (userTask.status !== "done") {
    throw new BadRequest("Task must be in 'done' status to approve or reject");
  }

  // --- لو رفض ---
  if (status === "rejected") {
    if (!rejection_reason)
      throw new BadRequest("Rejection reason is required");

    userTask.status = "in_progress"; // ❗ يبدأ شغل من جديد
    userTask.rejection_reason = rejection_reason;
  }

  // --- لو موافقة ---
  else if (status === "Approved") {
    userTask.status = "Approved";
    userTask.rejection_reason = undefined; // يتم مسح سبب الرفض
  }

  else {
    throw new BadRequest(
      "Invalid status. Only 'Approved' or 'rejected' allowed for done tasks"
    );
  }

  await userTask.save();

  return SuccessResponse(res, {
    message: "Task status updated successfully",
    userTask,
  });
};
