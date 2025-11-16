import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../../models/schema/Tasks';
import { ProjectModel } from '../../models/schema/project';
import { BadRequest } from '../../Errors/BadRequest';
import { NotFound } from '../../Errors/NotFound';
import { UnauthorizedError } from '../../Errors/unauthorizedError';
import { SuccessResponse } from '../../utils/response';

// إنشاء Task (Admin فقط)
export const createTask = async (req: Request, res: Response) => {
  const user = req.user;
    if (!user) throw new UnauthorizedError('Access denied. Admins only.');
    const { name, description, project_id, priority, end_date, Depatment_id } = req.body;

    // التأكد من وجود المشروع
    const projectExists = await ProjectModel.findById(project_id);
    if (!projectExists) throw new NotFound('Project not found');

    // الملفات
    const file = req.file?.path;           // ملف عادي
    const recorde = req.body.recorde || ''; // تسجيل حي (لو موجود كمسار)

    const task = new TaskModel({
      name,
      description,
      project_id,
      priority,
      end_date,
      Depatment_id,
      file,
      recorde,
      createdBy: user._id,
    });

    await task.save();
     SuccessResponse(res,{message: 'Task created successfully', task});

};

// جلب كل Tasks
export const getAllTasks = async (_req: Request, res: Response) => {
    const tasks = await TaskModel.find()
      .populate('project_id')
      .populate('Depatment_id')
      .populate('createdBy', 'name email'); // جلب اسم الـ Admin أو الشخص اللي أنشأ المهمة

 SuccessResponse(res,{message:'Tasks fetched successfully', tasks});

};

// جلب Task واحدة
export const getTaskById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest('Invalid Task ID');

    const task = await TaskModel.findById(id)
      .populate('project_id')
      .populate('Depatment_id')
      .populate('createdBy', 'name email');

    if (!task) throw new NotFound('Task not found');

     SuccessResponse(res,{message:'Task fetched successfully', task});

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
