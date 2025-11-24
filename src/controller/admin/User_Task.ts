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
import { sendEmail } from '../../utils/sendEmails';
import { UserTaskModel } from '../../models/schema/User_Task';
import { UserRejectedReason } from '../../models/schema/User_Rejection';

export const addUserToTask = async (req: Request, res: Response) => {

  const {user_id, task_id, role, User_taskId} = req.body;
  if (!user_id || !task_id) throw new BadRequest("User ID and Task ID are required");

  const task = await TaskModel.findById(task_id);
  if (!task) throw new NotFound("Task not found");

  const user =await UserProjectModel.findOne({user_id: user_id, project_id: task.projectId});
  if (!user) throw new NotFound("User not found in this project");

  const userTask = await UserTaskModel.findOne({user_id: user_id, task_id: task_id});
  if (userTask) throw new BadRequest("User already added to this task");
  

  const userTaskId = await UserTaskModel.create({
    user_id: user_id,
    task_id: task_id,
    role: role || 'Member',
    User_taskId: User_taskId,
    status: 'pending',
  });
  SuccessResponse(res, { message: "User added to task successfully", userTaskId });
}

export const updaterole = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const currentRole = String((req.user as any)?.role || '').toLowerCase();
  if (!["admin", "teamlead"].includes(currentRole)) {
    throw new UnauthorizedError("Only Admin or TeamLead can add users to task");
  }

  const { id } = req.params; // UserTask ID
  const { role,user_id } = req.body;

  if (!id) throw new BadRequest("Task ID is required");

  // جلب المهمة
  const task = await TaskModel.findById(id);
  if (!task) throw new NotFound("Task not found");
  

  // التأكد أن المستخدم عضو في المشروع
  const userProject = await UserProjectModel.findOne({ user_id, project_id: task.projectId });
  if (!userProject) throw new NotFound("User not found in this project");

  // جلب UserTask
  const userTask = await UserTaskModel.findOne({ user_id, task_id: id });
  if (!userTask) throw new NotFound("UserTask not found");

  userTask.role = role;
  await userTask.save();
  SuccessResponse(res, { message: "User role updated successfully", userTask });
 }

export const updateUserTaskStatus = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const currentRole = String((req.user as any)?.role || '').toLowerCase();

  if (!["admin", "teamlead"].includes(currentRole)) {
    throw new UnauthorizedError("Only Admin or TeamLead can update task status");
  }

  const { id } = req.params; // UserTask ID
  const { status, rejection_reasonId } = req.body;

  if (!id) throw new BadRequest("Task ID is required");


  const userTask = await UserTaskModel.findOne({ _id: id });
  if (!userTask) throw new NotFound("UserTask not found");

  const allowedStatuses = ["Approved from Member_can_approve", "done"];

  if (status === "rejected") {
    if (!rejection_reasonId) throw new BadRequest("Rejection reason is required");

    // سجل سبب الرفض
    await UserRejectedReason.create({
      userId,
      reasonId: rejection_reasonId,
      taskId: id
    });

    // تحويل جميع الـ hg status المرتبطة إلى pending_edit
    if (userTask.User_taskId && userTask.User_taskId.length > 0) {
      await UserTaskModel.updateMany(
        { _id: { $in: userTask.User_taskId } },
        { status: "pending_edit" }
      );
    }

    // تحديث حالة المهمة الحالية
    userTask.status = "rejected";
    const pointsuser = await User.findOne({ _id: userTask.user_id });
    if (pointsuser) {
      pointsuser.totalRejectedPoints = pointsuser.totalRejectedPoints + rejection_reasonId.points;
      await pointsuser.save();
    }

  } else {
    // التحقق من الحالة الحالية قبل السماح بالتغيير
    if (!userTask.status || !allowedStatuses.includes(userTask.status)) {
      throw new BadRequest(`Cannot change status. Current status must be ${allowedStatuses.join(" or ")}`);
    }
    userTask.status = status;
      if (status === "approved" || status === "done") {
      userTask.is_finished = true;
    }
  }

  await userTask.save();

  SuccessResponse(res, {
    message: "UserTask status updated successfully",
    userTask
    
  });
};


export const removedUserFromTask = async (req: Request, res: Response) => {
  // استخراج بيانات المستخدم الحالي
  const currentRole = String((req.user as any)?.role || "").toLowerCase();
  if (!["admin", "teamlead"].includes(currentRole)) {
    throw new UnauthorizedError("Only Admin or TeamLead can remove users from task");
  }

  // استخراج IDs من params
  const { user_id, task_id } = req.params;

  // البحث وحذف السطر الذي يربط هذا المستخدم بهذه المهمة
  const deletedUserTask = await UserTaskModel.findOneAndDelete({
     task_id,
    user_id 
   });

  if (!deletedUserTask) {
    throw new NotFound("This user is not assigned to this task");
  }

  // إرسال نجاح
  SuccessResponse(res, { message: "User removed from task successfully" });
};


export const getAllUserTask = async (req: Request, res: Response) => {
  const currentRole = String((req.user as any)?.role || "").toLowerCase();

  if (!["admin", "teamlead"].includes(currentRole)) {
    throw new UnauthorizedError("Only Admin or TeamLead can view user tasks");
  }

  const { id } = req.params;
  if (!id) throw new BadRequest("Task ID is required");

  const task = await TaskModel.findById(id);
  if (!task) throw new NotFound("Task not found");

  // جلب جميع اليوزرز المرتبطين بالتاسك
  const userTasks = await UserTaskModel.find({ task_id: id }).populate("user_id", "name email role"); 
  // "name email role" = الحقول اللي عايز تجيبها من اليوزر

  return SuccessResponse(res, {
    message: "User tasks fetched successfully",
    users: userTasks.map(ut => ut.user_id), // هنا هترجع بيانات اليوزر فقط
  });
};


