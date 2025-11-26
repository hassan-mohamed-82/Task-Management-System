import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../../models/schema/Tasks';
import { UserProjectModel } from '../../models/schema/User_Project';
import { UserTaskModel } from '../../models/schema/User_Task';
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
  const currentRole = String(req.user?.role || '').toLowerCase();

  if (!["admin", "teamlead"].includes(currentRole)) {
    throw new UnauthorizedError("Only Admin or TeamLead can update task status");
  }

  const { id } = req.params; // UserTask ID
  const { status, rejection_reasonId } = req.body;

  if (!id) throw new BadRequest("UserTask ID is required");

  const userTask = await UserTaskModel.findById(id);
  if (!userTask) throw new NotFound("UserTask not found");

  // SaaS check: Task must belong to admin
  const task = await TaskModel.findOne({ _id: userTask.task_id, createdBy: adminId });
  if (!task) throw new NotFound("You do not have access to this task");

  const allowedStatuses = ["Approved from Member_can_approve", "done"];

  if (status === "rejected") {
    if (!rejection_reasonId) throw new BadRequest("Rejection reason is required");

    const rejectionReason = await RejectedReson.findOne({
      _id: rejection_reasonId,
      createdBy: adminId
    });
    if (!rejectionReason) throw new NotFound("Rejection reason not found in your workspace");

    await UserRejectedReason.create({
      userId: userTask.user_id,
      reasonId: rejection_reasonId,
      taskId: userTask._id,
    });

    if (userTask.User_taskId?.length > 0) {
      await UserTaskModel.updateMany(
        { _id: { $in: userTask.User_taskId } },
        { status: "pending_edit" }
      );
    }

    userTask.status = "rejected";

    const pointsUser = await User.findById(userTask.user_id);
    if (pointsUser) {
      pointsUser.totalRejectedPoints = (pointsUser.totalRejectedPoints || 0) + (rejectionReason.points || 0);
      await pointsUser.save();
    }

    await TaskModel.findByIdAndUpdate(userTask.task_id, { status: "rejected" });

  } else {
    if (!userTask.status || !allowedStatuses.includes(userTask.status)) {
      throw new BadRequest(`Cannot change status. Current status must be ${allowedStatuses.join(" or ")}`);
    }

    userTask.status = status;
    if (["approved", "done"].includes(status)) {
      userTask.is_finished = true;
      await TaskModel.findByIdAndUpdate(userTask.task_id, { status });
    }
  }

  await userTask.save();

  SuccessResponse(res, { message: "UserTask status updated successfully", data: userTask });
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
