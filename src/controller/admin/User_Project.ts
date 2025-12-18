import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../../models/schema/Tasks';
import { ProjectModel } from '../../models/schema/project';
import { BadRequest } from '../../Errors/BadRequest';
import { NotFound } from '../../Errors/NotFound';
import { UnauthorizedError } from '../../Errors/unauthorizedError';
import { SuccessResponse } from '../../utils/response';
import { User } from '../../models/schema/auth/User';
import { UserProjectModel } from '../../models/schema/User_Project';
import { sendEmail } from '../../utils/sendEmails';

export const addUserToProject = async (req: Request, res: Response) => {
  const { user_id, email, project_id, role } = req.body;
  const roles = role || "member";

  if (!project_id || (!user_id && !email)) {
    throw new BadRequest("Missing required fields (user_id or email)");
  }

  // Find user (by ID or by Email)
  let user;

  if (user_id) {
    user = await User.findById(user_id);
  }

  if (!user && email) {
    user = await User.findOne({ email });
  }

  if (!user) throw new NotFound("User not found");

  // Check project exists
  const project = await ProjectModel.findById(project_id);
  if (!project) throw new NotFound("Project not found");

  // Prevent duplication
  const exists = await UserProjectModel.findOne({
    user_id: user._id,
    project_id,
  });

  if (exists) throw new BadRequest("User already added to this project");

  // Add user to project
  const userProject = await UserProjectModel.create({
    user_id: user._id,
    project_id,
    email: user.email,
    role: roles,
  });

  // Send email
  await sendEmail(
    user.email,
    `You have been added to the project: ${project.name}`,
    `
Hello ${user.name},

You have been added to a new project.

Project Name: ${project.name}
Your Role: ${roles}

Best regards,
Task Management System
`
  );

  SuccessResponse(res, {
    message: "User added to project successfully",
    userProject,
  });
};



export const getAllUsersInProject = async (req: Request, res: Response) => {
  const project_id = req.params.project_id;
  if (!project_id) throw new BadRequest("Project ID is required");

  if (!mongoose.Types.ObjectId.isValid(project_id)) {
    throw new BadRequest("Invalid project ID");
  }

  const users = await UserProjectModel.find({
    project_id: new mongoose.Types.ObjectId(project_id),
  }).populate("user_id", "name email");

  return SuccessResponse(res, { message: "Users fetched successfully", users });
};

export const deleteUserFromProject = async (req: Request, res: Response) => {
  const { user_id, project_id } = req.params;
  if (!user_id || !project_id) throw new BadRequest("User ID and Project ID are required");

  // Check if project exists and get creator
  const project = await ProjectModel.findById(project_id);
  if (!project) throw new NotFound("Project not found");

  // Prevent removing the project creator
  if (project.createdBy.toString() === user_id) {
    throw new BadRequest("Cannot remove the project creator from the project");
  }

  const userProject = await UserProjectModel.findOneAndDelete({ user_id, project_id });
  if (!userProject) throw new NotFound("User not found in project");

  return SuccessResponse(res, { message: "User removed from project successfully", userProject });
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { user_id, project_id } = req.params;
  const { role } = req.body;
  if (!user_id || !project_id || !role) throw new BadRequest("User ID, Project ID, and Role are required");

  const userProject = await UserProjectModel.findOneAndUpdate(
    { user_id, project_id },
    { role },
    { new: true }
  );

  if (!userProject) throw new NotFound("User not found in project");

  return SuccessResponse(res, { message: "User role updated successfully", userProject });
};


