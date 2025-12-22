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
import { TaskModel } from "../../models/schema/Tasks";
import { sendEmail } from "../../utils/sendEmails";
const toPublicPath = (p: string | null | undefined) => {
  if (!p) return null;

  // نخلي السلاشات كلها /
  const normalized = p.replace(/\\/g, "/"); // مثال: "D:/Task shit/dist/uploads/tasks/xx.pdf"

  // ندور على uploads/
  const lower = normalized.toLowerCase();
  let idx = lower.indexOf("/uploads/");
  if (idx === -1) idx = lower.indexOf("uploads/");
  if (idx === -1) return null; // لو مفيش كلمة uploads في المسار

  // نرجع من بعد الـ / لو موجودة قدام uploads
  const start = normalized[idx] === "/" ? idx + 1 : idx;

  // مثال الناتج: "uploads/tasks/xx.pdf"
  return normalized.substring(start);
};

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

  // First, get all tasks for this project
  const projectObjectId = new mongoose.Types.ObjectId(project_id);
  const projectTasks = await TaskModel.find({ projectId: projectObjectId, is_active: true });
  const taskIds = projectTasks.map(t => t._id);

  // Check if the user is a teamlead or admin in this project
  const userRole = (isMember.role || "").toLowerCase();
  const isTeamLeadOrAdmin = userRole === "teamlead" || userRole === "admin";

  // Build query based on user's role:
  // - Team leads and admins can see all tasks in the project
  // - Regular members only see their own assigned tasks
  const taskQuery: any = {
    task_id: { $in: taskIds }
  };

  // Only filter by user_id if NOT a team lead or admin
  if (!isTeamLeadOrAdmin) {
    taskQuery.user_id = user_id;
  }

  // Get UserTask entries based on role
  let tasks = await UserTaskModel.find(taskQuery)
    .populate({
      path: "user_id",
      select: "name email photo",
    })
    .populate({
      path: "task_id",
      select: "name description status priority start_date end_date is_finished file recorde projectId",
    })
    .populate({
      path: "User_taskId",
      populate: [
        {
          path: "task_id",
          select: "name description status priority start_date end_date is_finished file recorde",
        },
        {
          path: "user_id",
          select: "name email photo",
        }
      ],
    })
    .populate({
      path: "rejection_reasonId",
      select: "reason points",
    })
    .lean();

  // Filter out tasks where task_id is null
  tasks = tasks.filter((item: any) => item.task_id !== null);

  // نعدّل روابط file/recorde في الـ tasks والـ subTasks
  tasks = tasks.map((item: any) => {
    // task الرئيسي
    if (item.task_id) {
      item.task_id.file = buildUrl(item.task_id.file, req);
      item.task_id.recorde = buildUrl(item.task_id.recorde, req);
    }

    // الـ sub tasks الموجودة في User_taskId
    if (Array.isArray(item.User_taskId)) {
      item.User_taskId = item.User_taskId.map((sub: any) => {
        if (sub.task_id) {
          sub.task_id.file = buildUrl(sub.task_id.file, req);
          sub.task_id.recorde = buildUrl(sub.task_id.recorde, req);
        }
        return sub;
      });
    }

    return item;
  });

  SuccessResponse(res, {
    message: "Project details retrieved",
    userRoleinProject: userRole,
    project,
    members,
    tasks,
  });
};

const buildUrl = (p: string | null | undefined, req: Request) => {
  const publicPath = toPublicPath(p);
  if (!publicPath) return null;
  return `${req.protocol}://${req.get("host")}/${publicPath}`;
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

