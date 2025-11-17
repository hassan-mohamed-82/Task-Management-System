
import mongoose from "mongoose";
import { Request, Response } from "express";
import { ProjectModel } from "../../models/schema/project";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";
import { UserProjectModel } from "../../models/schema/User_Project";
import { User } from "../../models/schema/auth/User";
import { UserTaskModel } from "../../models/schema/User_Task";
export const getProjectDetailsForUser = async (req: Request, res: Response) => {
  const userId = req.user?._id; // استخدم _id من الـ user
  const { project_id } = req.params;

  if (!userId || !project_id) throw new BadRequest("User ID or Project ID missing");

  // التأكد أن المستخدم عضو في المشروع
  const isMember = await UserProjectModel.findOne({ userId, project_id });
  if (!isMember) throw new UnauthorizedError("You are not part of this project");

  // جلب بيانات المشروع
  const project = await ProjectModel.findById(project_id);
  if (!project) throw new NotFound("Project not found");

  // جلب أعضاء المشروع
  const members = await UserProjectModel.find({ project_id })
    .populate("userId", "name email photo role"); // populate مع الحقل الصحيح

  // جلب مهام المستخدم داخل المشروع
  const tasks = await UserTaskModel.find({ userId })
    .populate({
      path: "task_id",
      match: { projectId: project_id } // فلترة على المشروع
    });

  SuccessResponse(res, {
    message: "Project details retrieved",
    project,
    members,
    tasks
  });
};



export const getallProject = async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const projects = await UserProjectModel.find({ userId }).populate("project_id", "name");
    return SuccessResponse(res, { message: "Projects fetched successfully", projects });

};