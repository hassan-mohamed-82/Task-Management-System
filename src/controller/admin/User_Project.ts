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

export const addUserToProject = async (req: Request, res: Response) => {
  const { userId, project_id, role } = req.body;
  const roles = role || "Member"; // اختر قيمة موجودة في enum

  if (!userId || !project_id) {
    throw new BadRequest("Missing required fields");
  }

  // Check user exists
  const user = await User.findById(userId);
  if (!user) throw new NotFound("User not found");

  // Check project exists
  const project = await ProjectModel.findById(project_id);
  if (!project) throw new NotFound("Project not found");

  // Prevent duplication
  const exists = await UserProjectModel.findOne({ userId, project_id });
  if (exists) throw new BadRequest("User already added to this project");

  // Add user to project
  const userProject = await UserProjectModel.create({
    userId,
    project_id,
    email: user.email, // مهم
    role: roles,       // لازم يكون enum صحيح
  });

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

export const getUsersByProject = async (req: Request, res: Response) => {
  const { project_id  } = req.params;
  if (!project_id ) throw new BadRequest("Project ID is required");

  const users = await UserProjectModel.find({ project_id  }).populate("userId", "name email photo");

  return SuccessResponse(res, { message: "Users fetched successfully", users });
};


export const deleteUserFromProject = async (req: Request, res: Response) => {
  const { userId, project_id } = req.params;
  if (!userId || !project_id) throw new BadRequest("User ID and Project ID are required");

  const userProject = await UserProjectModel.findOneAndDelete({ userId, project_id });
  if (!userProject) throw new NotFound("User not found in project");

  return SuccessResponse(res, { message: "User removed from project successfully", userProject });
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { userId, project_id } = req.params;
  const { role } = req.body;
  if (!userId || !project_id || !role) throw new BadRequest("User ID, Project ID, and Role are required");

  const userProject = await UserProjectModel.findOneAndUpdate(
    { userId, project_id },
    { role },
    { new: true }
  );

  if (!userProject) throw new NotFound("User not found in project");

  return SuccessResponse(res, { message: "User role updated successfully", userProject });
};


