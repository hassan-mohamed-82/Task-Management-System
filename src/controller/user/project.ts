
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
import { sendEmail } from "../../utils/sendEmails";
export const getProjectDetailsForUser = async (req: Request, res: Response) => {
  const user_id = req.user?._id;
  const { project_id } = req.params;

  if (!user_id || !project_id) throw new BadRequest("User ID or Project ID missing");

  // التأكد أن المستخدم عضو في المشروع
  const isMember = await UserProjectModel.findOne({ user_id, project_id });
  if (!isMember) throw new UnauthorizedError("You are not part of this project");

  const project = await ProjectModel.findById(project_id);
  if (!project) throw new NotFound("Project not found");

  const members = await UserProjectModel.find({ project_id }).populate(
    "user_id",
    "name email photo role"
  );

  const tasks = await UserTaskModel.find({ user_id })
    .populate({
      path: "task_id",
      match: { projectId: project_id },
    })
    .populate({
      path: "User_taskId", // هنا بنجيب الـ sub tasks
      populate: {
        path: "task_id", // لو عايز تجيب بيانات الـ task لكل sub task
        select: "name status priority start_date end_date is_finished",
      },
    })
    .populate({
      path: "rejection_reasonId",
      select: "reason points",
    });

  SuccessResponse(res, {
    message: "Project details retrieved",
    project,
    members,
    tasks,
  });
};



export const getallProject = async (req: Request, res: Response) => {
  const user_id = req.user?._id;

  const projects = await UserProjectModel.find({
    user_id: user_id,
  }).populate("project_id", "name");

  return SuccessResponse(res, {
    message: "Projects fetched successfully",
    projects,
  });
};

