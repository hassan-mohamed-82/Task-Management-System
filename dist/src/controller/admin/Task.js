"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.getTaskById = exports.getAllTasks = exports.createTask = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const project_1 = require("../../models/schema/project");
const Tasks_1 = require("../../models/schema/Tasks");
const User_Project_1 = require("../../models/schema/User_Project");
// دالة لتحويل مسار الملف لمسار عام يبدأ من uploads/...
const toPublicPath = (p) => {
    if (!p)
        return null;
    // نخلي السلاشات كلها /
    const normalized = p.replace(/\\/g, "/"); // مثال: "D:/Task shit/dist/uploads/tasks/xx.pdf"
    // ندور على uploads/
    const lower = normalized.toLowerCase();
    let idx = lower.indexOf("/uploads/");
    if (idx === -1)
        idx = lower.indexOf("uploads/");
    if (idx === -1)
        return null; // لو مفيش كلمة uploads في المسار
    // نرجع من بعد الـ / لو موجودة قدام uploads
    const start = normalized[idx] === "/" ? idx + 1 : idx;
    // مثال الناتج: "uploads/tasks/xx.pdf"
    return normalized.substring(start);
};
const createTask = async (req, res) => {
    const user = req.user?._id;
    if (!user)
        throw new Errors_1.UnauthorizedError("Access denied.");
    const { name, description, projectId, priority, end_date, Depatment_id } = req.body;
    if (!name)
        throw new BadRequest_1.BadRequest("Task name is required");
    if (!projectId)
        throw new BadRequest_1.BadRequest("Project ID is required");
    // تأكد أن المشروع موجود
    const project = await project_1.ProjectModel.findById(projectId);
    if (!project)
        throw new Errors_1.NotFound("Project not found");
    // تحقق صلاحية المستخدم في المشروع
    const checkuseratproject = await User_Project_1.UserProjectModel.findOne({
        user_id: user,
        project_id: projectId
    });
    const role = req.user?.role?.toLowerCase();
    if (role !== "admin") {
        const userProjectRole = checkuseratproject?.role?.toLowerCase() ?? '';
        if (!checkuseratproject || ["member", "membercanapprove"].includes(userProjectRole)) {
            throw new Errors_1.UnauthorizedError("You can't create a task for this project");
        }
    }
    const endDateObj = end_date ? new Date(end_date) : undefined;
    // التعامل مع الملفات (pdf أو صوت أو أي نوع) من multer
    const files = req.files;
    const filePath = files?.file?.[0]?.path || null; // لوكال: D:\Task... | سيرفر: /var/www/.../dist/uploads/tasks/...
    const recordPath = files?.recorde?.[0]?.path || null; // نفس الفكرة للتسجيل
    const task = new Tasks_1.TaskModel({
        name,
        description,
        projectId: new mongoose_1.Types.ObjectId(projectId),
        priority,
        end_date: endDateObj,
        Depatment_id: Depatment_id ? new mongoose_1.Types.ObjectId(Depatment_id) : undefined,
        file: filePath, // نخزن المسار الأصلي اللي راجع من multer
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
    (0, response_1.SuccessResponse)(res, {
        message: "Task created successfully",
        task: { ...task.toObject(), file: fileUrl, recorde: recordUrl }
    });
};
exports.createTask = createTask;
// --------------------------
// GET ALL TASKS  (FIXED for SaaS)
// --------------------------
const getAllTasks = async (_req, res) => {
    const user = _req.user?._id;
    if (!user)
        throw new Errors_1.UnauthorizedError('Access denied.');
    // هات كل المشاريع اللي المستخدم موجود فيها
    const userProjects = await User_Project_1.UserProjectModel.find({ user_id: user });
    if (!userProjects.length)
        throw new Errors_1.UnauthorizedError("You are not assigned to any project.");
    // IDs of projects user is part of
    const projectIds = userProjects.map((p) => p.project_id);
    // هات التاسكات الخاصة بالمشاريع دي فقط
    const tasks = await Tasks_1.TaskModel.find({ projectId: { $in: projectIds } })
        .populate('projectId')
        .populate('Depatment_id')
        .populate('createdBy', 'name email');
    (0, response_1.SuccessResponse)(res, { message: 'Tasks fetched successfully', tasks });
};
exports.getAllTasks = getAllTasks;
// --------------------------
// GET TASK BY ID
// --------------------------
const getTaskById = async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new BadRequest_1.BadRequest('Invalid Task ID');
    const task = await Tasks_1.TaskModel.findById(id)
        .populate('projectId')
        .populate('Depatment_id')
        .populate('createdBy', 'name email');
    if (!task)
        throw new Errors_1.NotFound('Task not found');
    (0, response_1.SuccessResponse)(res, { message: 'Task fetched successfully', task });
};
exports.getTaskById = getTaskById;
// --------------------------
// UPDATE TASK
// --------------------------
const updateTask = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new Errors_1.UnauthorizedError("Access denied.");
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new BadRequest_1.BadRequest("Invalid Task ID");
    const task = await Tasks_1.TaskModel.findById(id);
    if (!task)
        throw new Errors_1.NotFound("Task not found");
    // تحقق من أن المستخدم جزء من نفس المشروع
    const userProject = await User_Project_1.UserProjectModel.findOne({
        user_id: userId,
        project_id: task.projectId
    });
    if (!userProject)
        throw new Errors_1.UnauthorizedError("You are not assigned to this project");
    const role = (userProject.role || '').toLowerCase();
    // فقط admin + teamlead يسمح لهم بالتعديل
    if (!["admin", "teamlead"].includes(role))
        throw new Errors_1.UnauthorizedError("You don't have permission to update this task");
    // تحديث البيانات
    const updates = req.body;
    if (req.file)
        updates.file = req.file.path;
    if (req.body.recorde)
        updates.recorde = req.body.recorde;
    Object.assign(task, updates);
    await task.save();
    (0, response_1.SuccessResponse)(res, {
        message: "Task updated successfully",
        task
    });
};
exports.updateTask = updateTask;
// --------------------------
// DELETE TASK
// --------------------------
const deleteTask = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new Errors_1.UnauthorizedError("Access denied.");
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new BadRequest_1.BadRequest("Invalid Task ID");
    const task = await Tasks_1.TaskModel.findById(id);
    if (!task)
        throw new Errors_1.NotFound("Task not found");
    // تحقق من الانتماء للمشروع
    const userProject = await User_Project_1.UserProjectModel.findOne({
        user_id: userId,
        project_id: task.projectId
    });
    if (!userProject)
        throw new Errors_1.UnauthorizedError("You are not assigned to this project");
    const role = (userProject.role || '').toLowerCase();
    // فقط admin + teamlead يسمح لهم بالحذف
    if (!["admin", "teamlead"].includes(role))
        throw new Errors_1.UnauthorizedError("You don't have permission to delete this task");
    await Tasks_1.TaskModel.findByIdAndDelete(id);
    (0, response_1.SuccessResponse)(res, { message: "Task deleted successfully" });
};
exports.deleteTask = deleteTask;
