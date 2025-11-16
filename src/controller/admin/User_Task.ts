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

    const project = await ProjectModel.findById(task.project_id);
    if (!project) {
        throw new NotFound("Project not found");
    }

    // التأكد أن اليوزر موجود في المشروع
    const userProject = await UserProjectModel.findOne({ user_id, project_id: project._id });
    if (!userProject) {
        throw new UnauthorizedError("User is not a member of the project");
    }

    // إنشاء علاقة User_Task بدل تعديل Task مباشرة
    const userTask = await UserTaskModel.create({
        user_id,
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

    const project = await ProjectModel.findById(task.project_id);
    if (!project) {
        throw new NotFound("Project not found");
    }

    // التأكد أن اليوزر موجود في المشروع
    const userProject = await UserProjectModel.findOne({ user_id, project_id: project._id });
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
    if (!taskId) {
        throw new BadRequest("Task ID is required");
    }
    const task = await TaskModel.findById(taskId);
    if (!task) {
        throw new NotFound("Task not found");
    }
    const userTasks = await UserTaskModel.find({ task_id: task._id }).populate("user_id", "name email photo");
    SuccessResponse(res, { message: "Users fetched successfully", userTasks });
};
