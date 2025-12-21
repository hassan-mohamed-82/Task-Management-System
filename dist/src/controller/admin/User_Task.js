"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUserTask = exports.removedUserFromTask = exports.updateUserTaskStatus = exports.updaterole = exports.addUserToTask = void 0;
const Tasks_1 = require("../../models/schema/Tasks");
const project_1 = require("../../models/schema/project");
const User_Project_1 = require("../../models/schema/User_Project");
const User_Task_1 = require("../../models/schema/User_Task");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
// --------------------------
// ADD USER TO TASK
// --------------------------
const addUserToTask = async (req, res) => {
    const adminId = req.user?._id;
    const { user_id, task_id, role, User_taskId, description } = req.body;
    if (!user_id || !task_id)
        throw new BadRequest_1.BadRequest("User ID and Task ID are required");
    // SaaS check: task must belong to current admin
    const task = await Tasks_1.TaskModel.findOne({ _id: task_id, createdBy: adminId });
    if (!task)
        throw new NotFound_1.NotFound("Task not found in your workspace");
    const userProject = await User_Project_1.UserProjectModel.findOne({ user_id, project_id: task.projectId });
    if (!userProject)
        throw new NotFound_1.NotFound("User not found in this project");
    const existingUserTask = await User_Task_1.UserTaskModel.findOne({ user_id, task_id });
    if (existingUserTask)
        throw new BadRequest_1.BadRequest("User already added to this task");
    if (task.status === 'Approved')
        throw new BadRequest_1.BadRequest("Task is approved and finished,There is no need to add user to this task");
    const newUserTask = await User_Task_1.UserTaskModel.create({
        user_id,
        task_id,
        role: role || 'member',
        User_taskId,
        is_active: true,
        status: 'pending',
        description,
    });
    (0, response_1.SuccessResponse)(res, { message: "User added to task successfully", data: newUserTask });
};
exports.addUserToTask = addUserToTask;
// --------------------------
// UPDATE USER ROLE IN TASK
// --------------------------
const updaterole = async (req, res) => {
    const adminId = req.user?._id;
    const currentRole = String(req.user?.role || '').toLowerCase();
    if (!["admin", "teamlead"].includes(currentRole)) {
        throw new unauthorizedError_1.UnauthorizedError("Only Admin or TeamLead can add users to task");
    }
    const { id } = req.params; // UserTask ID
    const { role, user_id, description } = req.body;
    if (!id)
        throw new BadRequest_1.BadRequest("UserTask ID is required");
    // SaaS check: Task must belong to admin
    const userTask = await User_Task_1.UserTaskModel.findById(id).populate('task_id');
    if (!userTask)
        throw new NotFound_1.NotFound("UserTask not found");
    // After populate, task_id is the full document, so extract _id properly
    const taskId = userTask.task_id?._id || userTask.task_id;
    const task = await Tasks_1.TaskModel.findOne({ _id: taskId, createdBy: adminId });
    if (!task)
        throw new NotFound_1.NotFound("You do not have access to this task");
    if (role)
        userTask.role = role;
    if (description !== undefined)
        userTask.description = description;
    await userTask.save();
    (0, response_1.SuccessResponse)(res, { message: "User role updated successfully", data: userTask });
};
exports.updaterole = updaterole;
// --------------------------
// UPDATE USER TASK STATUS
// --------------------------
const updateUserTaskStatus = async (req, res) => {
    const userId = req.user?._id;
    const globalRole = String(req.user?.role || "").toLowerCase();
    if (!userId)
        throw new unauthorizedError_1.UnauthorizedError("Access denied.");
    const { id } = req.params; // UserTask ID
    const { status } = req.body;
    if (!id)
        throw new BadRequest_1.BadRequest("UserTask ID is required");
    // Get the UserTask first
    const userTask = await User_Task_1.UserTaskModel.findById(id).populate('task_id');
    if (!userTask)
        throw new NotFound_1.NotFound("UserTask not found");
    // Get the task to find the project
    const task = await Tasks_1.TaskModel.findById(userTask.task_id);
    if (!task)
        throw new NotFound_1.NotFound("Task not found");
    // Admin bypass - can access any task they created
    if (globalRole === "admin") {
        if (task.createdBy?.toString() !== userId.toString()) {
            throw new unauthorizedError_1.UnauthorizedError("You do not have access to this task");
        }
    }
    else {
        // For users (teamlead), check project membership and role
        const userProject = await User_Project_1.UserProjectModel.findOne({
            user_id: userId,
            project_id: task.projectId
        });
        if (!userProject) {
            throw new unauthorizedError_1.UnauthorizedError("You are not assigned to this project");
        }
        const projectRole = (userProject.role || "").toLowerCase();
        if (!["admin", "teamlead"].includes(projectRole)) {
            throw new unauthorizedError_1.UnauthorizedError("Only Admin or TeamLead can update user task status");
        }
    }
    if (status)
        userTask.status = status;
    await userTask.save();
    (0, response_1.SuccessResponse)(res, { message: "User task status updated successfully", data: userTask });
};
exports.updateUserTaskStatus = updateUserTaskStatus;
// --------------------------
// REMOVE USER FROM TASK
// --------------------------
const removedUserFromTask = async (req, res) => {
    const adminId = req.user?._id;
    const currentRole = String(req.user?.role || "").toLowerCase();
    if (!["admin", "teamlead"].includes(currentRole)) {
        throw new unauthorizedError_1.UnauthorizedError("Only Admin or TeamLead can remove users from task");
    }
    const { user_id, task_id } = req.params;
    // SaaS check: task must belong to admin
    const task = await Tasks_1.TaskModel.findOne({ _id: task_id, createdBy: adminId });
    if (!task)
        throw new NotFound_1.NotFound("You do not have access to this task");
    // Get the project to check if user is the creator
    const project = await project_1.ProjectModel.findById(task.projectId);
    if (!project)
        throw new NotFound_1.NotFound("Project not found");
    // Prevent removing the project creator
    if (project.createdBy.toString() === user_id) {
        throw new BadRequest_1.BadRequest("Cannot remove the project creator from the task");
    }
    const deletedUserTask = await User_Task_1.UserTaskModel.findOneAndDelete({ task_id, user_id });
    if (!deletedUserTask)
        throw new NotFound_1.NotFound("This user is not assigned to this task");
    (0, response_1.SuccessResponse)(res, { message: "User removed from task successfully" });
};
exports.removedUserFromTask = removedUserFromTask;
// --------------------------
// GET ALL USER TASKS FOR A TASK
// --------------------------
const getAllUserTask = async (req, res) => {
    const adminId = req.user?._id;
    const currentRole = String(req.user?.role || "").toLowerCase();
    if (!["admin", "teamlead"].includes(currentRole)) {
        throw new unauthorizedError_1.UnauthorizedError("Only Admin or TeamLead can view user tasks");
    }
    const { id } = req.params; // task_id
    if (!id)
        throw new BadRequest_1.BadRequest("Task ID is required");
    // SaaS check: task must belong to admin
    const task = await Tasks_1.TaskModel.findOne({ _id: id, createdBy: adminId });
    if (!task)
        throw new NotFound_1.NotFound("Task not found in your workspace");
    const userTasks = await User_Task_1.UserTaskModel.find({ task_id: id, is_active: true })
        .populate("user_id", "name email role")
        .populate({
        path: "User_taskId",
        populate: {
            path: "user_id",
            select: "name email role"
        }
    });
    const usersWithUserTaskId = userTasks.map(ut => ({
        userTaskId: ut._id,
        user: ut.user_id,
        roleInsideTask: ut.role,
        status: ut.status,
        is_active: ut.is_active,
        is_finished: ut.is_finished,
        description: ut.description,
        dependsOn: ut.User_taskId,
        start_date: ut.start_date,
        end_date: ut.end_date,
    }));
    return (0, response_1.SuccessResponse)(res, { message: "User tasks fetched successfully", users: usersWithUserTaskId });
};
exports.getAllUserTask = getAllUserTask;
