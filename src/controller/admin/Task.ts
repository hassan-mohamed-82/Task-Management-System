import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../../models/schema/Tasks';
import { ProjectModel } from '../../models/schema/project';
import { BadRequest } from '../../Errors/BadRequest';
import { NotFound } from '../../Errors/NotFound';
import { UnauthorizedError } from '../../Errors/unauthorizedError';
import { SuccessResponse } from '../../utils/response';
import { Types } from "mongoose";


export const createTask = async (req: Request, res: Response) => {
  const user = req.user?._id;
  if (!user) throw new UnauthorizedError("Access denied.");

  const {
    name,
    description,
    projectId,
    priority,
    end_date,
    Depatment_id,
  } = req.body;

  if (!name) throw new BadRequest("Task name is required");
  if (!projectId) throw new BadRequest("Project ID is required");

  const project = await ProjectModel.findById(projectId);
  if (!project) throw new NotFound("Project not found");

  const endDateObj = end_date ? new Date(end_date) : undefined;

  // التعامل مع الملفات
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const filePath = files?.file?.[0]?.path || null;
  const recordPath = files?.recorde?.[0]?.path || null;

  const task = new TaskModel({
    name,
    description,
    projectId: new Types.ObjectId(projectId),
    priority,
    end_date: endDateObj,
    Depatment_id: Depatment_id ? new Types.ObjectId(Depatment_id) : undefined,
    file: filePath,
    recorde: recordPath,
    userId: user,
  });

  await task.save();

  // تحويل المسار المحلي لروابط ديناميكية حسب السيرفر
  const protocol = req.protocol;
  const host = req.get("host");

  const fileUrl = task.file ? `${protocol}://${host}/${task.file.replace(/\\/g, "/")}` : null;
  const recordUrl = task.recorde ? `${protocol}://${host}/${task.recorde.replace(/\\/g, "/")}` : null;

  SuccessResponse(res, {
    message: 'Task created successfully',
    task: {
      ...task.toObject(),
      file: fileUrl,
      recorde: recordUrl,
    }
  });
};


// جلب كل المهام
export const getAllTasks = async (_req: Request, res: Response) => {
  const tasks = await TaskModel.find()
    .populate('projectId')  // بدل project_id
    .populate('Depatment_id') // صح
    .populate('userId', 'name email'); // بدل createdBy

  SuccessResponse(res, { message: 'Tasks fetched successfully', tasks });
};

// جلب مهمة واحدة
export const getTaskById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest('Invalid Task ID');

  const task = await TaskModel.findById(id)
    .populate('projectId')       // بدل project_id
    .populate('Depatment_id')    // صح
    .populate('userId', 'name email'); // بدل createdBy

  if (!task) throw new NotFound('Task not found');

  SuccessResponse(res, { message: 'Task fetched successfully', task });
};

// تحديث Task (Admin فقط)
export const updateTask = async (req: Request, res: Response) => {
  const user = req.user;
    if(!user) throw new UnauthorizedError('Access denied.');
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest('Invalid Task ID');

    const task = await TaskModel.findById(id);
    if (!task) throw new NotFound('Task not found');

    // تحديث الحقول
    const updates = req.body;
    if (req.file) updates.file = req.file.path;       // تحديث الملف
    if (req.body.recorde) updates.recorde = req.body.recorde; // تحديث التسجيل

    Object.assign(task, updates);
    await task.save();

     SuccessResponse(res,{message:'Task updated successfully', task});

 
};

// حذف Task (Admin فقط)
export const deleteTask = async (req: Request, res: Response) => {
  const user = req.user;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest('Invalid Task ID');

    const task = await TaskModel.findByIdAndDelete(id);
    if (!task) throw new NotFound('Task not found');

     SuccessResponse(res,{message:'Task deleted successfully'});

};

