"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUserTask = exports.removedUserFromTask = exports.updateUserTaskStatus = exports.updaterole = exports.addUserToTask = void 0;
const Tasks_1 = require("../../models/schema/Tasks");
const User_Project_1 = require("../../models/schema/User_Project");
const User_Task_1 = require("../../models/schema/User_Task");
const User_Rejection_1 = require("../../models/schema/User_Rejection");
const RejectdReson_1 = require("../../models/schema/RejectdReson");
const User_1 = require("../../models/schema/auth/User");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
// --------------------------
// ADD USER TO TASK
// --------------------------
const addUserToTask = async (req, res) => {
    const adminId = req.user?._id;
    const { user_id, task_id, role, User_taskId } = req.body;
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
    const newUserTask = await User_Task_1.UserTaskModel.create({
        user_id,
        task_id,
        role: role || 'member',
        User_taskId,
        status: 'pending',
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
    const { role, user_id } = req.body;
    if (!id)
        throw new BadRequest_1.BadRequest("UserTask ID is required");
    // SaaS check: Task must belong to admin
    const userTask = await User_Task_1.UserTaskModel.findById(id).populate('task_id');
    if (!userTask)
        throw new NotFound_1.NotFound("UserTask not found");
    const task = await Tasks_1.TaskModel.findOne({ _id: userTask.task_id, createdBy: adminId });
    if (!task)
        throw new NotFound_1.NotFound("You do not have access to this task");
    userTask.role = role;
    await userTask.save();
    (0, response_1.SuccessResponse)(res, { message: "User role updated successfully", data: userTask });
};
exports.updaterole = updaterole;
// --------------------------
// UPDATE USER TASK STATUS
// --------------------------
const updateUserTaskStatus = async (req, res) => {
    const adminId = req.user?._id;
    const currentRole = String(req.user?.role || '').toLowerCase();
    if (!["admin", "teamlead"].includes(currentRole)) {
        throw new unauthorizedError_1.UnauthorizedError("Only Admin or TeamLead can update task status");
    }
    const { id } = req.params; // UserTask ID
    const { status, rejection_reasonId } = req.body;
    if (!id)
        throw new BadRequest_1.BadRequest("UserTask ID is required");
    const userTask = await User_Task_1.UserTaskModel.findById(id);
    if (!userTask)
        throw new NotFound_1.NotFound("UserTask not found");
    // SaaS check: Task must belong to admin
    const task = await Tasks_1.TaskModel.findOne({ _id: userTask.task_id, createdBy: adminId });
    if (!task)
        throw new NotFound_1.NotFound("You do not have access to this task");
    const allowedStatuses = ["Approved from Member_can_approve", "done"];
    if (status === "rejected") {
        if (!rejection_reasonId)
            throw new BadRequest_1.BadRequest("Rejection reason is required");
        const rejectionReason = await RejectdReson_1.RejectedReson.findOne({
            _id: rejection_reasonId,
            createdBy: adminId
        });
        if (!rejectionReason)
            throw new NotFound_1.NotFound("Rejection reason not found in your workspace");
        await User_Rejection_1.UserRejectedReason.create({
            userId: userTask.user_id,
            reasonId: rejection_reasonId,
            taskId: userTask._id,
        });
        if (userTask.User_taskId?.length > 0) {
            await User_Task_1.UserTaskModel.updateMany({ _id: { $in: userTask.User_taskId } }, { status: "pending_edit" });
        }
        userTask.status = "rejected";
        const pointsUser = await User_1.User.findById(userTask.user_id);
        if (pointsUser) {
            pointsUser.totalRejectedPoints = (pointsUser.totalRejectedPoints || 0) + (rejectionReason.points || 0);
            await pointsUser.save();
        }
        await Tasks_1.TaskModel.findByIdAndUpdate(userTask.task_id, { status: "rejected" });
    }
    else {
        if (!userTask.status || !allowedStatuses.includes(userTask.status)) {
            throw new BadRequest_1.BadRequest(`Cannot change status. Current status must be ${allowedStatuses.join(" or ")}`);
        }
        userTask.status = status;
        if (["approved", "done"].includes(status)) {
            userTask.is_finished = true;
            await Tasks_1.TaskModel.findByIdAndUpdate(userTask.task_id, { status });
        }
    }
    await userTask.save();
    (0, response_1.SuccessResponse)(res, { message: "UserTask status updated successfully", data: userTask });
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
    const userTasks = await User_Task_1.UserTaskModel.find({ task_id: id })
        .populate("user_id", "name email role");
    const usersWithUserTaskId = userTasks.map(ut => ({
        userTaskId: ut._id,
        user: ut.user_id,
        roleInsideTask: ut.role,
        status: ut.status,
        is_finished: ut.is_finished
    }));
    return (0, response_1.SuccessResponse)(res, { message: "User tasks fetched successfully", users: usersWithUserTaskId });
};
exports.getAllUserTask = getAllUserTask;
