"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getalluserattask = exports.removeUserFromTask = exports.addUserTask = void 0;
const Tasks_1 = require("../../models/schema/Tasks");
const project_1 = require("../../models/schema/project");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const User_1 = require("../../models/schema/auth/User");
const User_Project_1 = require("../../models/schema/User_Project");
const User_Task_1 = require("../../models/schema/User_Task");
const addUserTask = async (req, res) => {
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
    const project = await project_1.ProjectModel.findById(task.project_id);
    if (!project) {
        throw new NotFound_1.NotFound("Project not found");
    }
    // التأكد أن اليوزر موجود في المشروع
    const userProject = await User_Project_1.UserProjectModel.findOne({ user_id, project_id: project._id });
    if (!userProject) {
        throw new unauthorizedError_1.UnauthorizedError("User is not a member of the project");
    }
    // إنشاء علاقة User_Task بدل تعديل Task مباشرة
    const userTask = await User_Task_1.UserTaskModel.create({
        user_id,
        task_id: task._id,
        status: "pending" // default status
    });
    (0, response_1.SuccessResponse)(res, { message: "User added to task successfully", userTask });
};
exports.addUserTask = addUserTask;
const removeUserFromTask = async (req, res) => {
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
    const project = await project_1.ProjectModel.findById(task.project_id);
    if (!project) {
        throw new NotFound_1.NotFound("Project not found");
    }
    // التأكد أن اليوزر موجود في المشروع
    const userProject = await User_Project_1.UserProjectModel.findOne({ user_id, project_id: project._id });
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
    const { taskId } = req.params;
    if (!taskId) {
        throw new BadRequest_1.BadRequest("Task ID is required");
    }
    const task = await Tasks_1.TaskModel.findById(taskId);
    if (!task) {
        throw new NotFound_1.NotFound("Task not found");
    }
    const userTasks = await User_Task_1.UserTaskModel.find({ task_id: task._id }).populate("user_id", "name email photo");
    (0, response_1.SuccessResponse)(res, { message: "Users fetched successfully", userTasks });
};
exports.getalluserattask = getalluserattask;
