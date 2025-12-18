"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getallProject = exports.getProjectDetailsForUser = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const project_1 = require("../../models/schema/project");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const User_Project_1 = require("../../models/schema/User_Project");
const User_Task_1 = require("../../models/schema/User_Task");
const Tasks_1 = require("../../models/schema/Tasks");
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
const getProjectDetailsForUser = async (req, res) => {
    const user_id = req.user?._id;
    const { project_id } = req.params;
    if (!user_id || !project_id)
        throw new BadRequest_1.BadRequest("User ID or Project ID missing");
    // التأكد أن المستخدم عضو في المشروع
    const isMember = await User_Project_1.UserProjectModel.findOne({ user_id, project_id });
    if (!isMember)
        throw new unauthorizedError_1.UnauthorizedError("You are not part of this project");
    const project = await project_1.ProjectModel.findById(project_id);
    if (!project)
        throw new NotFound_1.NotFound("Project not found");
    const members = await User_Project_1.UserProjectModel.find({ project_id }).populate("user_id", "name email photo role");
    // First, get all tasks for this project
    const projectObjectId = new mongoose_1.default.Types.ObjectId(project_id);
    const projectTasks = await Tasks_1.TaskModel.find({ projectId: projectObjectId, is_active: true });
    const taskIds = projectTasks.map(t => t._id);
    // Check if the user is a teamlead or admin in this project
    const userRole = (isMember.role || "").toLowerCase();
    const isTeamLeadOrAdmin = userRole === "teamlead" || userRole === "admin";
    // Build query based on user's role:
    // - Team leads and admins can see all tasks in the project
    // - Regular members only see their own assigned tasks
    const taskQuery = {
        task_id: { $in: taskIds }
    };
    // Only filter by user_id if NOT a team lead or admin
    if (!isTeamLeadOrAdmin) {
        taskQuery.user_id = user_id;
    }
    // Get UserTask entries based on role
    let tasks = await User_Task_1.UserTaskModel.find(taskQuery)
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
    tasks = tasks.filter((item) => item.task_id !== null);
    // نعدّل روابط file/recorde في الـ tasks والـ subTasks
    tasks = tasks.map((item) => {
        // task الرئيسي
        if (item.task_id) {
            item.task_id.file = buildUrl(item.task_id.file, req);
            item.task_id.recorde = buildUrl(item.task_id.recorde, req);
        }
        // الـ sub tasks الموجودة في User_taskId
        if (Array.isArray(item.User_taskId)) {
            item.User_taskId = item.User_taskId.map((sub) => {
                if (sub.task_id) {
                    sub.task_id.file = buildUrl(sub.task_id.file, req);
                    sub.task_id.recorde = buildUrl(sub.task_id.recorde, req);
                }
                return sub;
            });
        }
        return item;
    });
    (0, response_1.SuccessResponse)(res, {
        message: "Project details retrieved",
        project,
        members,
        tasks,
    });
};
exports.getProjectDetailsForUser = getProjectDetailsForUser;
const buildUrl = (p, req) => {
    const publicPath = toPublicPath(p);
    if (!publicPath)
        return null;
    return `${req.protocol}://${req.get("host")}/${publicPath}`;
};
const getallProject = async (req, res) => {
    const user_id = req.user?._id;
    const projects = await User_Project_1.UserProjectModel.find({
        user_id: user_id,
    }).populate("project_id", "name");
    return (0, response_1.SuccessResponse)(res, {
        message: "Projects fetched successfully",
        projects,
    });
};
exports.getallProject = getallProject;
