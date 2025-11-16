import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../../models/schema/Tasks';
import { BadRequest } from '../../Errors/BadRequest';
import { NotFound } from '../../Errors/NotFound';
import { UnauthorizedError } from '../../Errors/unauthorizedError';
import { SuccessResponse } from '../../utils/response';
import { User } from '../../models/schema/auth/User';
import {UserProjectModel} from '../../models/schema/User_Project';
import { sendEmail } from '../../utils/sendEmails';

export const addUserToProject = async (req: Request, res: Response) => {
  const { user_id, project_id, role , email} = req.body;
  
  let roles = role || "member"; // declare role as a let variable

  if (!user_id || !project_id ) {
    throw new BadRequest("Missing required fields");
  }

  const user = await User.findById(user_id);
  if (!user) {
    throw new NotFound("User not found");
  }

  const project = await UserProjectModel.findById(project_id);
  if (!project) {
    throw new NotFound("Project not found");
  }

  const userProject = await UserProjectModel.create({ user_id, project_id, role: roles });
  sendEmail(user.email, "User Added to Project", `You have been added to a project as a ${roles}.`);
  return SuccessResponse(res, { message: "User added to project successfully", userProject });

}

export const getUsersByProject = async (req: Request, res: Response) => {
  const { project_id } = req.params;
  if (!project_id) {
    throw new BadRequest("Project ID is required");
  }
  const users = await UserProjectModel.find({ project_id }).populate("user_id","name email photo");
  return SuccessResponse(res, { message: "Users fetched successfully", users });
};

export const deleteUserFromProject = async (req: Request, res: Response) => {
  const { user_id, project_id } = req.params;
  if (!user_id || !project_id) {
    throw new BadRequest("User ID and Project ID are required");
  }
  const userProject = await UserProjectModel.findOneAndDelete({ user_id, project_id });
  if (!userProject) {
    throw new NotFound("User not found in project");
  }
  return SuccessResponse(res, { message: "User removed from project successfully", userProject });
};

export const updateuserRole = async (req: Request, res: Response) => {
  const { user_id, project_id } = req.params;
  const { role } = req.body;
  if (!user_id || !project_id || !role) {
    throw new BadRequest("User ID, Project ID, and Role are required");
  }
  const userProject = await UserProjectModel.findOneAndUpdate({ user_id, project_id }, { role }, { new: true });
  if (!userProject) {
    throw new NotFound("User not found in project");
  }
  return SuccessResponse(res, { message: "User role updated successfully", userProject });
};

