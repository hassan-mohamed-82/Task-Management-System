
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
 if(!userId) throw new UnauthorizedError("You are not authorized to perform this action");
 let useratproject =await UserProjectModel.findOne({userId:userId})
 if(useratproject?.role !== "administrator") throw new UnauthorizedError("You are not authorized to perform this action");
 
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
  const userId = req.user?._id; // _id من الـ user
 if(!userId) throw new UnauthorizedError("You are not authorized to perform this action");
 let useratproject =await UserProjectModel.findOne({userId:userId})
if((useratproject?.role === "administrator") || (useratproject?.role === "Member")) throw new UnauthorizedError("You are not authorized to perform this action");  const { taskId } = req.params;
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


export const addUserTask = async (req: Request, res: Response) => {
  const userpremision =req.user?._id;
  if(!userpremision) throw new UnauthorizedError("You are not authorized to perform this action");
 let useratproject =await UserProjectModel.findOne({userId:userpremision})
 if(useratproject?.role !== "administrator") throw new UnauthorizedError("You are not authorized to perform this action");

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
  const userpremision =req.user?._id;
  if(!userpremision) throw new UnauthorizedError("You are not authorized to perform this action");
 let useratproject =await UserProjectModel.findOne({userId:userpremision})
 if(useratproject?.role !== "administrator") throw new UnauthorizedError("You are not authorized to perform this action");

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
  const userpremision =req.user?._id;
  if(!userpremision) throw new UnauthorizedError("You are not authorized to perform this action");
 let useratproject =await UserProjectModel.findOne({userId:userpremision})
 if(useratproject?.role !== "administrator") throw new UnauthorizedError("You are not authorized to perform this action");

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
  const userpremision =req.user?._id;
  if(!userpremision) throw new UnauthorizedError("You are not authorized to perform this action");
 let useratproject =await UserProjectModel.findOne({userId:userpremision})
 if(useratproject?.role !== "administrator") throw new UnauthorizedError("You are not authorized to perform this action");

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
