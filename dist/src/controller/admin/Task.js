"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.getTaskById = exports.getAllTasks = exports.createTask = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Tasks_1 = require("../../models/schema/Tasks");
const project_1 = require("../../models/schema/project");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const mongoose_2 = require("mongoose");
const createTask = async (req, res) => {
    const user = req.user?._id;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError("Access denied.");
    const { name, description, projectId, priority, end_date, Depatment_id, } = req.body;
    if (!name)
        throw new BadRequest_1.BadRequest("Task name is required");
    if (!projectId)
        throw new BadRequest_1.BadRequest("Project ID is required");
    const project = await project_1.ProjectModel.findById(projectId);
    if (!project)
        throw new NotFound_1.NotFound("Project not found");
    const endDateObj = end_date ? new Date(end_date) : undefined;
    // التعامل مع الملفات
    const files = req.files;
    const filePath = files?.file?.[0]?.path || null;
    const recordPath = files?.recorde?.[0]?.path || null;
    const task = new Tasks_1.TaskModel({
        name,
        description,
        projectId: new mongoose_2.Types.ObjectId(projectId),
        priority,
        end_date: endDateObj,
        Depatment_id: Depatment_id ? new mongoose_2.Types.ObjectId(Depatment_id) : undefined,
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
    (0, response_1.SuccessResponse)(res, {
        message: 'Task created successfully',
        task: {
            ...task.toObject(),
            file: fileUrl,
            recorde: recordUrl,
        }
    });
};
exports.createTask = createTask;
// جلب كل المهام
const getAllTasks = async (_req, res) => {
    const tasks = await Tasks_1.TaskModel.find()
        .populate('projectId') // بدل project_id
        .populate('Depatment_id') // صح
        .populate('userId', 'name email'); // بدل createdBy
    (0, response_1.SuccessResponse)(res, { message: 'Tasks fetched successfully', tasks });
};
exports.getAllTasks = getAllTasks;
// جلب مهمة واحدة
const getTaskById = async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new BadRequest_1.BadRequest('Invalid Task ID');
    const task = await Tasks_1.TaskModel.findById(id)
        .populate('projectId') // بدل project_id
        .populate('Depatment_id') // صح
        .populate('userId', 'name email'); // بدل createdBy
    if (!task)
        throw new NotFound_1.NotFound('Task not found');
    (0, response_1.SuccessResponse)(res, { message: 'Task fetched successfully', task });
};
exports.getTaskById = getTaskById;
// تحديث Task (Admin فقط)
const updateTask = async (req, res) => {
    const user = req.user;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError('Access denied.');
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new BadRequest_1.BadRequest('Invalid Task ID');
    const task = await Tasks_1.TaskModel.findById(id);
    if (!task)
        throw new NotFound_1.NotFound('Task not found');
    // تحديث الحقول
    const updates = req.body;
    if (req.file)
        updates.file = req.file.path; // تحديث الملف
    if (req.body.recorde)
        updates.recorde = req.body.recorde; // تحديث التسجيل
    Object.assign(task, updates);
    await task.save();
    (0, response_1.SuccessResponse)(res, { message: 'Task updated successfully', task });
};
exports.updateTask = updateTask;
// حذف Task (Admin فقط)
const deleteTask = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new BadRequest_1.BadRequest('Invalid Task ID');
    const task = await Tasks_1.TaskModel.findByIdAndDelete(id);
    if (!task)
        throw new NotFound_1.NotFound('Task not found');
    (0, response_1.SuccessResponse)(res, { message: 'Task deleted successfully' });
};
exports.deleteTask = deleteTask;
