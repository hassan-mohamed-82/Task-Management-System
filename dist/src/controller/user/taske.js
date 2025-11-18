"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskStatus = exports.getalluserattask = exports.removeUserFromTask = exports.addUserTask = exports.requestTaskApproval = exports.getMyTasks = exports.updateUserTaskStatus = exports.getUserTasksByProject = void 0;
const project_1 = require("../../models/schema/project");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const User_Project_1 = require("../../models/schema/User_Project");
const User_1 = require("../../models/schema/auth/User");
const Tasks_1 = require("../../models/schema/Tasks");
const User_Task_1 = require("../../models/schema/User_Task");
const getUserTasksByProject = async (req, res) => {
    const userId = req.user?._id; // _id من الـ user
    if (!userId)
        throw new unauthorizedError_1.UnauthorizedError("You are not authorized to perform this action");
    let useratproject = await User_Project_1.UserProjectModel.findOne({ userId: userId });
    if (useratproject?.role !== "administrator")
        throw new unauthorizedError_1.UnauthorizedError("You are not authorized to perform this action");
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
    const userId = req.user?._id; // _id من الـ user
    if (!userId)
        throw new unauthorizedError_1.UnauthorizedError("You are not authorized to perform this action");
    let useratproject = await User_Project_1.UserProjectModel.findOne({ userId: userId });
    if ((useratproject?.role === "administrator") || (useratproject?.role === "Member"))
        throw new unauthorizedError_1.UnauthorizedError("You are not authorized to perform this action");
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
const addUserTask = async (req, res) => {
    const userpremision = req.user?._id;
    if (!userpremision)
        throw new unauthorizedError_1.UnauthorizedError("You are not authorized to perform this action");
    let useratproject = await User_Project_1.UserProjectModel.findOne({ userId: userpremision });
    if (useratproject?.role !== "administrator")
        throw new unauthorizedError_1.UnauthorizedError("You are not authorized to perform this action");
    const { taskId, user_id } = req.body;
    if (!taskId || !user_id) {
        throw new BadRequest_1.BadRequest("Missing required fields");
    }
    const task = await Tasks_1.TaskModel.findById(taskId);
    if (!task) {
        throw new NotFound_1.NotFound("Task not found");
    }
    const user = await User_1.User.findById(user_id);
    if (!user) {
        throw new NotFound_1.NotFound("User not found");
    }
    const project = await project_1.ProjectModel.findById(task.projectId);
    if (!project) {
        throw new NotFound_1.NotFound("Project not found");
    }
    // التأكد أن اليوزر موجود في المشروع
    const userProject = await User_Project_1.UserProjectModel.findOne({
        userId: user_id,
        project_id: project._id
    });
    if (!userProject) {
        throw new unauthorizedError_1.UnauthorizedError("User is not a member of the project");
    }
    const userTask = await User_Task_1.UserTaskModel.create({
        userId: user_id, // صحح الاسم هنا
        task_id: task._id,
        status: "pending" // default status
    });
    (0, response_1.SuccessResponse)(res, { message: "User added to task successfully", userTask });
};
exports.addUserTask = addUserTask;
const removeUserFromTask = async (req, res) => {
    const userpremision = req.user?._id;
    if (!userpremision)
        throw new unauthorizedError_1.UnauthorizedError("You are not authorized to perform this action");
    let useratproject = await User_Project_1.UserProjectModel.findOne({ userId: userpremision });
    if (useratproject?.role !== "administrator")
        throw new unauthorizedError_1.UnauthorizedError("You are not authorized to perform this action");
    const { taskId, user_id } = req.params;
    if (!taskId || !user_id) {
        throw new BadRequest_1.BadRequest("Missing required fields");
    }
    const task = await Tasks_1.TaskModel.findById(taskId);
    if (!task) {
        throw new NotFound_1.NotFound("Task not found");
    }
    const user = await User_1.User.findById(user_id);
    if (!user) {
        throw new NotFound_1.NotFound("User not found");
    }
    const project = await project_1.ProjectModel.findById(task.projectId);
    if (!project) {
        throw new NotFound_1.NotFound("Project not found");
    }
    // التأكد أن اليوزر موجود في المشروع
    const userProject = await User_Project_1.UserProjectModel.findOne({ user_id, projectId: project._id });
    if (!userProject) {
        throw new unauthorizedError_1.UnauthorizedError("User is not a member of the project");
    }
    const userTask = await User_Task_1.UserTaskModel.findOneAndDelete({ user_id, task_id: task._id });
    if (!userTask) {
        throw new NotFound_1.NotFound("User not found in task");
    }
    (0, response_1.SuccessResponse)(res, { message: "User removed from task successfully", userTask });
};
exports.removeUserFromTask = removeUserFromTask;
const getalluserattask = async (req, res) => {
    const userpremision = req.user?._id;
    if (!userpremision)
        throw new unauthorizedError_1.UnauthorizedError("You are not authorized to perform this action");
    let useratproject = await User_Project_1.UserProjectModel.findOne({ userId: userpremision });
    if (useratproject?.role !== "administrator")
        throw new unauthorizedError_1.UnauthorizedError("You are not authorized to perform this action");
    const { taskId } = req.params;
    if (!taskId)
        throw new BadRequest_1.BadRequest("Task ID is required");
    const task = await Tasks_1.TaskModel.findById(taskId);
    if (!task)
        throw new NotFound_1.NotFound("Task not found");
    // صححت الاسم هنا
    const userTasks = await User_Task_1.UserTaskModel.find({ task_id: task._id })
        .populate("userId", "name email photo");
    (0, response_1.SuccessResponse)(res, { message: "Users fetched successfully", userTasks });
};
exports.getalluserattask = getalluserattask;
const updateTaskStatus = async (req, res) => {
    const userpremision = req.user?._id;
    if (!userpremision)
        throw new unauthorizedError_1.UnauthorizedError("You are not authorized to perform this action");
    let useratproject = await User_Project_1.UserProjectModel.findOne({ userId: userpremision });
    if (useratproject?.role !== "administrator")
        throw new unauthorizedError_1.UnauthorizedError("You are not authorized to perform this action");
    const { taskId, userId } = req.params;
    const { status, rejection_reason } = req.body;
    const userTask = await User_Task_1.UserTaskModel.findOne({
        task_id: taskId,
        user_id: userId
    });
    if (!userTask)
        throw new NotFound_1.NotFound("User task not found");
    // لازم تكون الحالة الحالية done علشان approve أو reject
    if (userTask.status !== "done") {
        throw new BadRequest_1.BadRequest("Task must be in 'done' status to approve or reject");
    }
    // --- لو رفض ---
    if (status === "rejected") {
        if (!rejection_reason)
            throw new BadRequest_1.BadRequest("Rejection reason is required");
        userTask.status = "in_progress"; // ❗ يبدأ شغل من جديد
        userTask.rejection_reason = rejection_reason;
    }
    // --- لو موافقة ---
    else if (status === "Approved") {
        userTask.status = "Approved";
        userTask.rejection_reason = undefined; // يتم مسح سبب الرفض
    }
    else {
        throw new BadRequest_1.BadRequest("Invalid status. Only 'Approved' or 'rejected' allowed for done tasks");
    }
    await userTask.save();
    return (0, response_1.SuccessResponse)(res, {
        message: "Task status updated successfully",
        userTask,
    });
};
exports.updateTaskStatus = updateTaskStatus;
