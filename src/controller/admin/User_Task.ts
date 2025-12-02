import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../../models/schema/Tasks';
import { UserProjectModel } from '../../models/schema/User_Project';
import { IUserTask, UserTaskModel } from '../../models/schema/User_Task';
import { UserRejectedReason } from '../../models/schema/User_Rejection';
import { RejectedReson } from '../../models/schema/RejectdReson';
import { User } from '../../models/schema/auth/User';
import { BadRequest } from '../../Errors/BadRequest';
import { NotFound } from '../../Errors/NotFound';
import { UnauthorizedError } from '../../Errors/unauthorizedError';
import { SuccessResponse } from '../../utils/response';

// --------------------------
// ADD USER TO TASK
// --------------------------
export const addUserToTask = async (req: Request, res: Response) => {
  const adminId = req.user?._id;
  const { user_id, task_id, role, User_taskId } = req.body;

  if (!user_id || !task_id) throw new BadRequest("User ID and Task ID are required");

  // SaaS check: task must belong to current admin
  const task = await TaskModel.findOne({ _id: task_id, createdBy: adminId });
  if (!task) throw new NotFound("Task not found in your workspace");

  const userProject = await UserProjectModel.findOne({ user_id, project_id: task.projectId });
  if (!userProject) throw new NotFound("User not found in this project");

  const existingUserTask = await UserTaskModel.findOne({ user_id, task_id });
  if (existingUserTask) throw new BadRequest("User already added to this task");

  const newUserTask = await UserTaskModel.create({
    user_id,
    task_id,
    role: role || 'member',
    User_taskId,
    status: 'pending',
  });

  SuccessResponse(res, { message: "User added to task successfully", data: newUserTask });
};

// --------------------------
// UPDATE USER ROLE IN TASK
// --------------------------
export const updaterole = async (req: Request, res: Response) => {
  const adminId = req.user?._id;
  const currentRole = String(req.user?.role || '').toLowerCase();

  if (!["admin", "teamlead"].includes(currentRole)) {
    throw new UnauthorizedError("Only Admin or TeamLead can add users to task");
  }

  const { id } = req.params; // UserTask ID
  const { role, user_id } = req.body;
  if (!id) throw new BadRequest("UserTask ID is required");

  // SaaS check: Task must belong to admin
  const userTask = await UserTaskModel.findById(id).populate('task_id');
  if (!userTask) throw new NotFound("UserTask not found");

  const task = await TaskModel.findOne({ _id: userTask.task_id, createdBy: adminId });
  if (!task) throw new NotFound("You do not have access to this task");

  userTask.role = role;
  await userTask.save();

  SuccessResponse(res, { message: "User role updated successfully", data: userTask });
};

// --------------------------
// UPDATE USER TASK STATUS
// --------------------------
export const updateUserTaskStatus = async (req: Request, res: Response) => {
  const adminId = req.user?._id;
  const currentRole = String(req.user?.role || "").toLowerCase();

  if (!["admin", "teamlead"].includes(currentRole)) {
    throw new UnauthorizedError("Only Admin or TeamLead can update task status");
  }

  const { id } = req.params;
  const { status, rejection_reasonId } = req.body;

  if (!id) throw new BadRequest("UserTask ID is required");
  if (!status) throw new BadRequest("Status is required");

  const userTask = await UserTaskModel.findById(id);
  if (!userTask) throw new NotFound("UserTask not found");

  const task = await TaskModel.findOne({
    _id: userTask.task_id,
    createdBy: adminId,
  });
  if (!task) throw new NotFound("You do not have access to this task");

  // التأكد إن الـ Task جاهزة للـ Admin Review
  if (task.status !== "waiting_for_approve") {
    throw new BadRequest(
      `Cannot review task. Task must be 'waiting_for_approve', current: '${task.status}'`
    );
  }

  // ======================
  // REJECT
  // ======================
  if (status === "rejected") {
    if (!rejection_reasonId) {
      throw new BadRequest("Rejection reason is required");
    }

    const rejectionReason = await RejectedReson.findOne({
      _id: rejection_reasonId,
      createdBy: adminId,
    });

    if (!rejectionReason) {
      throw new NotFound("Rejection reason not found in your workspace");
    }

    // نجيب كل الـ UserTasks المرتبطة بالـ Task
    const allUserTasks = await UserTaskModel.find({ task_id: task._id });

    // نعمل loop على كل UserTask
    for (const ut of allUserTasks) {
      // نسجل سبب الرفض لكل يوزر
      await UserRejectedReason.create({
        userId: ut.user_id,
        reasonId: rejection_reasonId,
        taskId: task._id,
      });

      // نزود نقاط الرفض لكل يوزر
      const pointsUser = await User.findById(ut.user_id);
      if (pointsUser) {
        pointsUser.totalRejectedPoints =
          (pointsUser.totalRejectedPoints || 0) + (rejectionReason.points || 0);
        await pointsUser.save();
      }
    }

    // نرجع كل الـ UserTasks لـ pending_edit
    await UserTaskModel.updateMany(
      { task_id: task._id },
      { status: "pending_edit", is_finished: false }
    );

    // الـ Task الكبيرة ترجع Pending
    task.status = "Pending";
    await task.save();
  }

  // ======================
  // APPROVE
  // ======================
  else if (status === "Approved") {
    await UserTaskModel.updateMany(
      { task_id: task._id },
      { is_finished: true }
    );

    task.status = "Approved";
    await task.save();
  }

  else {
    throw new BadRequest("Status must be either 'Approved' or 'rejected'");
  }

  SuccessResponse(res, {
    message: "Task status updated successfully",
    data: { task },
  });
};

// --------------------------
// REMOVE USER FROM TASK
// --------------------------
export const removedUserFromTask = async (req: Request, res: Response) => {
  const adminId = req.user?._id;
  const currentRole = String(req.user?.role || "").toLowerCase();

  if (!["admin", "teamlead"].includes(currentRole)) {
    throw new UnauthorizedError("Only Admin or TeamLead can remove users from task");
  }

  const { user_id, task_id } = req.params;

  // SaaS check: task must belong to admin
  const task = await TaskModel.findOne({ _id: task_id, createdBy: adminId });
  if (!task) throw new NotFound("You do not have access to this task");

  const deletedUserTask = await UserTaskModel.findOneAndDelete({ task_id, user_id });
  if (!deletedUserTask) throw new NotFound("This user is not assigned to this task");

  SuccessResponse(res, { message: "User removed from task successfully" });
};

// --------------------------
// GET ALL USER TASKS FOR A TASK
// --------------------------
export const getAllUserTask = async (req: Request, res: Response) => {
  const adminId = req.user?._id;
  const currentRole = String(req.user?.role || "").toLowerCase();

  if (!["admin", "teamlead"].includes(currentRole)) {
    throw new UnauthorizedError("Only Admin or TeamLead can view user tasks");
  }

  const { id } = req.params; // task_id
  if (!id) throw new BadRequest("Task ID is required");

  // SaaS check: task must belong to admin
  const task = await TaskModel.findOne({ _id: id, createdBy: adminId });
  if (!task) throw new NotFound("Task not found in your workspace");

  const userTasks = await UserTaskModel.find({ task_id: id })
    .populate("user_id", "name email role");

  const usersWithUserTaskId = userTasks.map(ut => ({
    userTaskId: ut._id,
    user: ut.user_id,
    roleInsideTask: ut.role,
    status: ut.status,
    is_finished: ut.is_finished
  }));

  return SuccessResponse(res, { message: "User tasks fetched successfully", users: usersWithUserTaskId });
};
