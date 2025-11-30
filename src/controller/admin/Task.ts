import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import path from "path";
import {  NotFound, UnauthorizedError } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { ProjectModel } from "../../models/schema/project";
import { TaskModel } from "../../models/schema/Tasks";
import { UserProjectModel } from "../../models/schema/User_Project";

// دالة لتحويل مسار الملف لمسار عام يبدأ من uploads/...
const toPublicPath = (p: string | null) => {
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

export const createTask = async (req: Request, res: Response) => {
  const user = req.user?._id;
  if (!user) throw new UnauthorizedError("Access denied.");

  const { name, description, projectId, priority, end_date, Depatment_id } = req.body;

  if (!name) throw new BadRequest("Task name is required");
  if (!projectId) throw new BadRequest("Project ID is required");

  // تأكد أن المشروع موجود
  const project = await ProjectModel.findById(projectId);
  if (!project) throw new NotFound("Project not found");

  // تحقق صلاحية المستخدم في المشروع
  const checkuseratproject = await UserProjectModel.findOne({
    user_id: user,
    project_id: projectId
  });

  const role = req.user?.role?.toLowerCase();
  if (role !== "admin") {
    const userProjectRole = checkuseratproject?.role?.toLowerCase() ?? '';
    if (!checkuseratproject || ["member", "membercanapprove"].includes(userProjectRole)) {
      throw new UnauthorizedError("You can't create a task for this project");
    }
  }

  const endDateObj = end_date ? new Date(end_date) : undefined;

  // التعامل مع الملفات (pdf أو صوت أو أي نوع) من multer
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const filePath = files?.file?.[0]?.path || null;      // لوكال: D:\Task... | سيرفر: /var/www/.../dist/uploads/tasks/...
  const recordPath = files?.recorde?.[0]?.path || null; // نفس الفكرة للتسجيل

  const task = new TaskModel({
    name,
    description,
    projectId: new Types.ObjectId(projectId),
    priority,
    end_date: endDateObj,
    Depatment_id: Depatment_id ? new Types.ObjectId(Depatment_id) : undefined,
    file: filePath,        // نخزن المسار الأصلي اللي راجع من multer
    recorde: recordPath,
    createdBy: user,
  });

  await task.save();

  // نحول المسار لمسار عام يمكن الوصول له من /uploads
  const publicFilePath = toPublicPath(task.file);
  const publicRecordPath = toPublicPath(task.recorde);

  const fileUrl = publicFilePath
    ? `${req.protocol}://${req.get("host")}/${publicFilePath}`
    : null;

  const recordUrl = publicRecordPath
    ? `${req.protocol}://${req.get("host")}/${publicRecordPath}`
    : null;

  SuccessResponse(res, {
    message: "Task created successfully",
    task: { ...task.toObject(), file: fileUrl, recorde: recordUrl }
  });
};


// --------------------------
// GET ALL TASKS  (FIXED for SaaS)
// --------------------------
export const getAllTasks = async (_req: Request, res: Response) => {
  const user = _req.user?._id;
  if (!user) throw new UnauthorizedError('Access denied.');

  // هات كل المشاريع اللي المستخدم موجود فيها
  const userProjects = await UserProjectModel.find({ user_id: user });

  if (!userProjects.length)
    throw new UnauthorizedError("You are not assigned to any project.");

  // IDs of projects user is part of
  const projectIds = userProjects.map((p) => p.project_id);

  // هات التاسكات الخاصة بالمشاريع دي فقط
  const tasks = await TaskModel.find({ projectId: { $in: projectIds } })
    .populate('projectId')
    .populate('Depatment_id')
    .populate('createdBy', 'name email');

  SuccessResponse(res, { message: 'Tasks fetched successfully', tasks });
};

// --------------------------
// GET TASK BY ID
// --------------------------
export const getTaskById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest('Invalid Task ID');

  const task = await TaskModel.findById(id)
    .populate('projectId')
    .populate('Depatment_id')
    .populate('createdBy', 'name email');

  if (!task) throw new NotFound('Task not found');

  SuccessResponse(res, { message: 'Task fetched successfully', task });
};

// --------------------------
// UPDATE TASK
// --------------------------
export const updateTask = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedError("Access denied.");

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest("Invalid Task ID");

  const task = await TaskModel.findById(id);
  if (!task) throw new NotFound("Task not found");

  // تحقق من أن المستخدم جزء من نفس المشروع
  const userProject = await UserProjectModel.findOne({
    user_id: userId,
    project_id: task.projectId
  });

  if (!userProject)
    throw new UnauthorizedError("You are not assigned to this project");

  const role = (userProject.role || '').toLowerCase();

  // فقط admin + teamlead يسمح لهم بالتعديل
  if (!["admin", "teamlead"].includes(role))
    throw new UnauthorizedError("You don't have permission to update this task");

  // تحديث البيانات
  const updates = req.body;

  if (req.file) updates.file = req.file.path;
  if (req.body.recorde) updates.recorde = req.body.recorde;

  Object.assign(task, updates);
  await task.save();

  SuccessResponse(res, {
    message: "Task updated successfully",
    task
  });
};

// --------------------------
// DELETE TASK
// --------------------------
export const deleteTask = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedError("Access denied.");

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest("Invalid Task ID");

  const task = await TaskModel.findById(id);
  if (!task) throw new NotFound("Task not found");

  // تحقق من الانتماء للمشروع
  const userProject = await UserProjectModel.findOne({
    user_id: userId,
    project_id: task.projectId
  });

  if (!userProject)
    throw new UnauthorizedError("You are not assigned to this project");

  const role = (userProject.role || '').toLowerCase();

  // فقط admin + teamlead يسمح لهم بالحذف
  if (!["admin", "teamlead"].includes(role))
    throw new UnauthorizedError("You don't have permission to delete this task");

  await TaskModel.findByIdAndDelete(id);

  SuccessResponse(res, { message: "Task deleted successfully" });
};
