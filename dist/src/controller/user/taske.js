"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTaskApproval = exports.getMyTasks = exports.updateUserTaskStatus = exports.getUserTasksByProject = void 0;
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const response_1 = require("../../utils/response");
const User_Project_1 = require("../../models/schema/User_Project");
const User_Task_1 = require("../../models/schema/User_Task");
const getUserTasksByProject = async (req, res) => {
    const userId = req.user?._id; // _id من الـ user
    const { project_id } = req.params;
    if (!userId || !project_id)
        throw new BadRequest_1.BadRequest("User ID or Project ID missing");
    // التأكد أن المستخدم عضو في المشروع
    const userProject = await User_Project_1.UserProjectModel.findOne({ userId, project_id });
    if (!userProject)
        throw new NotFound_1.NotFound("User is not part of this project");
    // جلب كل المهام الخاصة بالمستخدم في المشروع
    const tasks = await User_Task_1.UserTaskModel.find({ userId })
        .populate({
        path: "task_id",
        match: { projectId: project_id } // فلترة على المشروع (Task يحتوي على projectId)
    });
    // فلترة المهام اللي موجودة فقط ضمن المشروع
    const userTasks = tasks.filter(t => t.task_id !== null);
    (0, response_1.SuccessResponse)(res, { message: "User tasks fetched successfully", userTasks });
};
exports.getUserTasksByProject = getUserTasksByProject;
const updateUserTaskStatus = async (req, res) => {
    const userId = req.user?._id; // استخدم _id من الـ user
    const { taskId } = req.params;
    const { status } = req.body;
    if (!userId || !taskId || !status)
        throw new BadRequest_1.BadRequest("Missing required fields");
    const userTask = await User_Task_1.UserTaskModel.findOne({ task_id: taskId, userId });
    if (!userTask)
        throw new NotFound_1.NotFound("Task not found");
    // السماح فقط بتغيير الحالة خطوة خطوة: pending → in_progress → done
    const allowedTransitions = {
        pending: "in_progress",
        in_progress: "done"
    };
    if (!userTask.status || ["done", "Approved", "rejected"].includes(userTask.status)) {
        throw new BadRequest_1.BadRequest("Cannot change status of tasks that are done, Approved or Rejected");
    }
    if (allowedTransitions[userTask.status] !== status) {
        throw new BadRequest_1.BadRequest(`Invalid status transition. You can only move from ${userTask.status} to ${allowedTransitions[userTask.status]}`);
    }
    userTask.status = status;
    await userTask.save();
    (0, response_1.SuccessResponse)(res, { message: `Task status updated to ${status}`, userTask });
};
exports.updateUserTaskStatus = updateUserTaskStatus;
const getMyTasks = async (req, res) => {
    const userId = req.user?._id;
    const tasks = await User_Task_1.UserTaskModel.find({ userId })
        .populate({
        path: "task_id",
        select: "name description priority status projectId",
        populate: {
            path: "projectId",
            select: "name description" // أي حقول عايز تظهر من المشروع
        }
    });
    (0, response_1.SuccessResponse)(res, {
        message: "User tasks",
        tasks
    });
};
exports.getMyTasks = getMyTasks;
const requestTaskApproval = async (req, res) => {
    const userId = req.user?._id;
    const { taskId } = req.params;
    if (!userId || !taskId)
        throw new BadRequest_1.BadRequest("Missing required fields");
    const userTask = await User_Task_1.UserTaskModel.findOne({ task_id: taskId, userId });
    if (!userTask)
        throw new NotFound_1.NotFound("Task not found");
    if (userTask.status !== "done") {
        throw new BadRequest_1.BadRequest("You must complete the task before requesting approval");
    }
    userTask.status = "Pending_Approval";
    await userTask.save();
    (0, response_1.SuccessResponse)(res, {
        message: "Task approval request sent to admin",
        userTask
    });
};
exports.requestTaskApproval = requestTaskApproval;
