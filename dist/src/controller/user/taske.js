"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selection = exports.getTaskDetailsForApprover = exports.reviewUserTaskByApprover = exports.getTaskDetailsForUser = exports.updateUserTaskStatus = exports.getalltaskatprojectforuser = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const User_Project_1 = require("../../models/schema/User_Project");
const User_1 = require("../../models/schema/auth/User");
const User_Task_1 = require("../../models/schema/User_Task");
const User_Rejection_1 = require("../../models/schema/User_Rejection");
const Tasks_1 = require("../../models/schema/Tasks");
const RejectdReson_1 = require("../../models/schema/RejectdReson");
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
const buildUrl = (p, req) => {
    const publicPath = toPublicPath(p);
    if (!publicPath)
        return null;
    return `${req.protocol}://${req.get("host")}/${publicPath}`;
};
const getalltaskatprojectforuser = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new BadRequest_1.BadRequest("User ID is required");
    const { taskId } = req.params;
    if (!taskId)
        throw new BadRequest_1.BadRequest("Task ID is required");
    const task = await Tasks_1.TaskModel.findOne({ _id: taskId });
    if (!task)
        throw new NotFound_1.NotFound("Task not found");
    // Check if user is part of the project
    const userProject = await User_Project_1.UserProjectModel.findOne({ user_id: userId, project_id: task.projectId });
    if (!userProject)
        throw new NotFound_1.NotFound("User not found in this project");
    // Check allowed roles
    const allowedRoles = ["teamlead", "member", "membercanapprove", "admin"];
    const projectRole = String(userProject.role || "").toLowerCase();
    if (!allowedRoles.includes(projectRole)) {
        throw new unauthorizedError_1.UnauthorizedError("You are not allowed to access this project tasks");
    }
    // Check if user is teamlead or admin (can view all tasks in project)
    const isTeamLeadOrAdmin = projectRole === "teamlead" || projectRole === "admin";
    // For regular members, check if they are assigned to this task
    if (!isTeamLeadOrAdmin) {
        const usertask = await User_Task_1.UserTaskModel.findOne({ task_id: taskId, user_id: userId });
        if (!usertask)
            throw new BadRequest_1.BadRequest("You are not allowed to access this project tasks");
    }
    // Build query based on role:
    // - Team leads and admins can see all user tasks for this task
    // - Regular members only see their own assignment
    const taskQuery = { task_id: taskId, is_active: true };
    if (!isTeamLeadOrAdmin) {
        taskQuery.user_id = userId;
    }
    const tasks = await User_Task_1.UserTaskModel.find(taskQuery)
        .populate('user_id', 'name email photo')
        .populate('task_id', 'name description status priority start_date end_date is_finished');
    (0, response_1.SuccessResponse)(res, { message: "Tasks found successfully", data: tasks });
};
exports.getalltaskatprojectforuser = getalltaskatprojectforuser;
const updateUserTaskStatus = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new BadRequest_1.BadRequest("User ID is required");
    const { taskId } = req.params;
    if (!taskId)
        throw new BadRequest_1.BadRequest("Task ID is required");
    if (!mongoose_1.default.Types.ObjectId.isValid(taskId)) {
        throw new BadRequest_1.BadRequest("Invalid Task ID");
    }
    const { status, rejection_reasonId } = req.body;
    if (!status)
        throw new BadRequest_1.BadRequest("Status is required");
    const userTask = await User_Task_1.UserTaskModel.findOne({
        _id: taskId,
        user_id: userId,
    });
    if (!userTask)
        throw new NotFound_1.NotFound("UserTask not found for this user");
    const role = userTask.role;
    const currentStatus = userTask.status;
    // ================= تحقق من المهام المرتبطة =================
    const needAllRelatedFinished = ((role === "member" || role === "membercanapprove") &&
        (currentStatus === "in_progress" || currentStatus === "in_progress_edit") &&
        status === "done") ||
        (role === "membercanapprove" &&
            currentStatus === "done" &&
            (status === "Approved from Member_can_approve" ||
                status === "rejected from Member_can_rejected"));
    if (needAllRelatedFinished &&
        userTask.User_taskId &&
        userTask.User_taskId.length > 0) {
        const relatedTasks = await User_Task_1.UserTaskModel.find({
            _id: { $in: userTask.User_taskId },
        });
        const allFinished = relatedTasks.every((t) => t.is_finished === true);
        if (!allFinished) {
            throw new BadRequest_1.BadRequest("Some related tasks are not finished yet");
        }
    }
    // ================= Member FLOW =================
    if (role === "member") {
        if (currentStatus === "pending" && status === "in_progress") {
            userTask.status = "in_progress";
            userTask.is_finished = false;
            userTask.start_date = new Date();
        }
        else if (currentStatus === "in_progress" && status === "done") {
            userTask.status = "done";
            userTask.is_finished = true;
            userTask.end_date = new Date();
        }
        else if (currentStatus === "pending_edit" && status === "in_progress_edit") {
            userTask.status = "in_progress_edit";
            userTask.is_finished = false;
            userTask.start_date = new Date();
        }
        else if (currentStatus === "in_progress_edit" && status === "done") {
            userTask.status = "done";
            userTask.is_finished = true;
            userTask.end_date = new Date();
        }
        else {
            throw new BadRequest_1.BadRequest("Member cannot perform this status change");
        }
    }
    // ============ Membercanapprove FLOW ============
    else if (role === "membercanapprove") {
        if (currentStatus === "pending" && status === "in_progress") {
            userTask.status = "in_progress";
            userTask.is_finished = false;
            userTask.start_date = new Date();
        }
        else if (currentStatus === "in_progress" && status === "done") {
            userTask.status = "done";
            userTask.is_finished = true;
            userTask.end_date = new Date();
        }
        else if (currentStatus === "pending_edit" && status === "in_progress_edit") {
            userTask.status = "in_progress_edit";
            userTask.is_finished = false;
            userTask.start_date = new Date();
        }
        else if (currentStatus === "in_progress_edit" && status === "done") {
            userTask.status = "done";
            userTask.is_finished = true;
            userTask.end_date = new Date();
        }
        else if (currentStatus === "done" &&
            status === "Approved from Member_can_approve") {
            userTask.status = "Approved from Member_can_approve";
            userTask.is_finished = true;
        }
        else if (currentStatus === "done" &&
            status === "rejected from Member_can_rejected") {
            if (!rejection_reasonId) {
                throw new BadRequest_1.BadRequest("Rejection reason is required");
            }
            const rejectionReason = await RejectdReson_1.RejectedReson.findById(rejection_reasonId);
            if (!rejectionReason) {
                throw new NotFound_1.NotFound("Rejection reason not found");
            }
            await User_Rejection_1.UserRejectedReason.create({
                userId: userTask.user_id,
                reasonId: rejection_reasonId,
                taskId: userTask.task_id,
            });
            const pointsUser = await User_1.User.findById(userTask.user_id);
            if (pointsUser) {
                pointsUser.totalRejectedPoints =
                    (pointsUser.totalRejectedPoints || 0) + (rejectionReason.points || 0);
                await pointsUser.save();
            }
            if (userTask.User_taskId && userTask.User_taskId.length > 0) {
                await User_Task_1.UserTaskModel.updateMany({ _id: { $in: userTask.User_taskId } }, { status: "pending_edit", is_finished: false });
            }
            userTask.status = "rejected from Member_can_rejected";
            userTask.is_finished = false;
            userTask.rejection_reasonId = rejection_reasonId;
        }
        else {
            throw new BadRequest_1.BadRequest("Membercanapprove cannot perform this status change");
        }
    }
    else {
        throw new BadRequest_1.BadRequest("Invalid user role for this task");
    }
    await userTask.save();
    // ⬇️⬇️⬇️ ============ تحديث حالة الـ Task الكبيرة تلقائياً ============ ⬇️⬇️⬇️
    const task = await Tasks_1.TaskModel.findById(userTask.task_id);
    if (task) {
        // ✅ CASE 1: أول مرة - pending → in_progress
        // أو بعد الرفض - pending_edit → in_progress_edit
        // الـ Task تتحول من Pending → in_progress
        if (task.status === "Pending" &&
            (userTask.status === "in_progress" || userTask.status === "in_progress_edit")) {
            task.status = "in_progress";
            await task.save();
        }
        // ✅ CASE 2: كل الـ membercanapprove عملوا approve
        // الـ Task تتحول من in_progress → waiting_for_approve
        else if (task.status === "in_progress") {
            const allUserTasks = await User_Task_1.UserTaskModel.find({ task_id: userTask.task_id });
            const approverTasks = allUserTasks.filter((ut) => ut.role === "membercanapprove");
            if (approverTasks.length > 0) {
                // فيه approvers - لازم كلهم يوافقوا
                const allApproved = approverTasks.every((ut) => ut.status === "Approved from Member_can_approve");
                if (allApproved) {
                    task.status = "waiting_for_approve";
                    await task.save();
                }
            }
            else {
                // مفيش approvers - لازم كل الناس يخلصوا (done)
                const allDone = allUserTasks.every((ut) => ut.status === "done" || ut.is_finished === true);
                if (allDone) {
                    task.status = "waiting_for_approve";
                    await task.save();
                }
            }
        }
    }
    // ⬆️⬆️⬆️ ============ نهاية التحديث التلقائي ============ ⬆️⬆️⬆️
    return (0, response_1.SuccessResponse)(res, {
        message: "Task status updated successfully",
        task: userTask,
    });
};
exports.updateUserTaskStatus = updateUserTaskStatus;
const getTaskDetailsForUser = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new BadRequest_1.BadRequest("User ID is required");
    const { taskId } = req.params;
    if (!taskId)
        throw new BadRequest_1.BadRequest("Task ID is required");
    // First, try to find as UserTask ID (to view a specific user's task)
    let userTask = await User_Task_1.UserTaskModel.findById(taskId)
        .populate('user_id', 'name email')
        .populate('task_id', 'name description status priority start_date end_date is_finished');
    if (userTask) {
        // Found as UserTask ID - check if current user has permission to view
        const task = await Tasks_1.TaskModel.findById(userTask.task_id);
        if (!task)
            throw new NotFound_1.NotFound("Task not found");
        // Check if current user is in the project
        const userProject = await User_Project_1.UserProjectModel.findOne({
            user_id: userId,
            project_id: task.projectId
        });
        if (!userProject)
            throw new NotFound_1.NotFound("User not found in this project");
        // Check if current user is the owner of this UserTask OR is membercanapprove/teamlead/admin
        const projectRole = String(userProject.role || "").toLowerCase();
        const isOwnTask = userTask.user_id && userTask.user_id._id?.toString() === userId.toString();
        if (!isOwnTask && !["membercanapprove", "teamlead", "admin"].includes(projectRole)) {
            throw new unauthorizedError_1.UnauthorizedError("You don't have permission to view this task");
        }
        // For membercanapprove, verify they're assigned to the same parent Task
        if (!isOwnTask && projectRole === "membercanapprove") {
            const approverUserTask = await User_Task_1.UserTaskModel.findOne({
                task_id: task._id,
                user_id: userId
            });
            if (!approverUserTask) {
                throw new unauthorizedError_1.UnauthorizedError("You must be assigned to this task to view others' details");
            }
        }
        return (0, response_1.SuccessResponse)(res, { message: "Task found successfully", data: userTask });
    }
    // Fallback: Try as Task ID (original behavior)
    const task = await Tasks_1.TaskModel.findOne({ _id: taskId });
    if (!task)
        throw new NotFound_1.NotFound("Task not found");
    // تحقق إن اليوزر في المشروع
    const userProject = await User_Project_1.UserProjectModel.findOne({
        user_id: userId,
        project_id: task.projectId
    });
    if (!userProject)
        throw new NotFound_1.NotFound("User not found in this project");
    // تحقق من الصلاحيات
    const allowedRoles = ["teamlead", "member", "membercanapprove", "admin"];
    const projectRole = String(userProject.role || "").toLowerCase();
    if (!allowedRoles.includes(projectRole)) {
        throw new unauthorizedError_1.UnauthorizedError("You are not allowed to access this project tasks");
    }
    // جيب الـ UserTask للمستخدم الحالي
    userTask = await User_Task_1.UserTaskModel.findOne({
        task_id: taskId,
        user_id: userId
    })
        .populate('user_id', 'name email')
        .populate('task_id', 'name description status priority start_date end_date is_finished');
    if (!userTask)
        throw new NotFound_1.NotFound("You are not assigned to this task");
    (0, response_1.SuccessResponse)(res, { message: "Task found successfully", data: userTask });
};
exports.getTaskDetailsForUser = getTaskDetailsForUser;
const reviewUserTaskByApprover = async (req, res) => {
    const approverId = req.user?._id;
    if (!approverId)
        throw new BadRequest_1.BadRequest("User ID is required");
    const { taskId } = req.params;
    if (!taskId)
        throw new BadRequest_1.BadRequest("Task ID is required");
    if (!mongoose_1.default.Types.ObjectId.isValid(taskId)) {
        throw new BadRequest_1.BadRequest("Invalid Task ID");
    }
    const userTasks = await User_Task_1.UserTaskModel.findById(taskId);
    if (!userTasks) {
        throw new NotFound_1.NotFound("UserTask not found");
    }
    const approverUserTask = await User_Task_1.UserTaskModel.findOne({
        task_id: userTasks.task_id,
        user_id: approverId,
    });
    if (!approverUserTask) {
        throw new unauthorizedError_1.UnauthorizedError("You are not assigned to this task");
    }
    const approverRole = (approverUserTask.role || "").toLowerCase();
    if (approverRole !== "membercanapprove") {
        throw new unauthorizedError_1.UnauthorizedError("You don't have permission to review this task");
    }
    const { status, rejection_reasonId } = req.body;
    const allowedStatuses = [
        "Approved from Member_can_approve",
        "rejected from Member_can_rejected",
    ];
    if (!status || !allowedStatuses.includes(status)) {
        throw new BadRequest_1.BadRequest("Status must be either 'Approved from Member_can_approve' or 'rejected from Member_can_rejected'");
    }
    const userTask = await User_Task_1.UserTaskModel.findById(taskId);
    if (!userTask) {
        throw new NotFound_1.NotFound("UserTask not found");
    }
    if (userTask.status !== "done") {
        throw new BadRequest_1.BadRequest("Task must be in 'done' status to be reviewed");
    }
    // تحقق من الـ related tasks
    if (userTask.User_taskId && userTask.User_taskId.length > 0) {
        const relatedTasks = await User_Task_1.UserTaskModel.find({
            _id: { $in: userTask.User_taskId },
        });
        const allFinished = relatedTasks.every((t) => t.is_finished === true);
        if (!allFinished) {
            throw new BadRequest_1.BadRequest("Some related tasks are not finished yet");
        }
    }
    // ================== APPROVE FLOW ==================
    if (status === "Approved from Member_can_approve") {
        userTask.status = "Approved from Member_can_approve";
        userTask.is_finished = true;
    }
    // ================== REJECT FLOW ==================
    if (status === "rejected from Member_can_rejected") {
        if (!rejection_reasonId) {
            throw new BadRequest_1.BadRequest("Rejection reason is required");
        }
        const rejectionReason = await RejectdReson_1.RejectedReson.findById(rejection_reasonId);
        if (!rejectionReason) {
            throw new NotFound_1.NotFound("Rejection reason not found");
        }
        // ⬇️⬇️⬇️ سجل سبب الرفض لهذا الـ User فقط ⬇️⬇️⬇️
        await User_Rejection_1.UserRejectedReason.create({
            userId: userTask.user_id,
            reasonId: rejection_reasonId,
            taskId: userTask.task_id,
        });
        // زود نقاط الرفض لهذا الـ User فقط
        const pointsUser = await User_1.User.findById(userTask.user_id);
        if (pointsUser) {
            pointsUser.totalRejectedPoints =
                (pointsUser.totalRejectedPoints || 0) + (rejectionReason.points || 0);
            await pointsUser.save();
        }
        // هذا الـ UserTask فقط → pending_edit
        userTask.status = "pending_edit";
        userTask.is_finished = false;
        userTask.rejection_reasonId = rejection_reasonId;
        await userTask.save();
        // ⬇️⬇️⬇️ الـ Task الكبيرة ترجع Pending ⬇️⬇️⬇️
        const task = await Tasks_1.TaskModel.findById(userTask.task_id);
        if (task) {
            task.status = "Pending";
            await task.save();
        }
        return (0, response_1.SuccessResponse)(res, {
            message: "Task rejected and sent back for editing",
            task: userTask,
        });
    }
    await userTask.save();
    // ============ تحديث حالة الـ Task الكبيرة تلقائياً (للـ Approve) ============
    const task = await Tasks_1.TaskModel.findById(userTask.task_id);
    if (task && task.status === "in_progress") {
        const allUserTasks = await User_Task_1.UserTaskModel.find({ task_id: userTask.task_id });
        const approverTasks = allUserTasks.filter((ut) => ut.role === "membercanapprove");
        if (approverTasks.length > 0) {
            const allApproved = approverTasks.every((ut) => ut.status === "Approved from Member_can_approve");
            if (allApproved) {
                task.status = "waiting_for_approve";
                await task.save();
            }
        }
    }
    return (0, response_1.SuccessResponse)(res, {
        message: "User task reviewed successfully",
        task: userTask,
    });
};
exports.reviewUserTaskByApprover = reviewUserTaskByApprover;
/**
 * GET route for "Member Can Approve" role
 * Returns comprehensive task details including:
 * - Task Information (name, description, priority, status, end_date, file)
 * - Project Information
 * - Current User Info (role, status, is_finished)
 * - Team Members list with their statuses
 * - Summary & Statistics
 */
const getTaskDetailsForApprover = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new BadRequest_1.BadRequest("User ID is required");
    const { taskId } = req.params;
    if (!taskId)
        throw new BadRequest_1.BadRequest("Task ID is required");
    if (!mongoose_1.default.Types.ObjectId.isValid(taskId)) {
        throw new BadRequest_1.BadRequest("Invalid Task ID");
    }
    // First check if this is a UserTask ID
    const userTaskById = await User_Task_1.UserTaskModel.findById(taskId);
    let mainTaskId;
    if (userTaskById) {
        // If taskId is a UserTask ID, get the actual Task ID
        mainTaskId = userTaskById.task_id;
    }
    else {
        // Assume it's a Task ID directly
        mainTaskId = new mongoose_1.default.Types.ObjectId(taskId);
    }
    // Get the main task
    const task = await Tasks_1.TaskModel.findById(mainTaskId)
        .populate('projectId', 'name description')
        .populate('Depatment_id', 'name');
    if (!task)
        throw new NotFound_1.NotFound("Task not found");
    // Check if the user is in the project
    const userProject = await User_Project_1.UserProjectModel.findOne({
        user_id: userId,
        project_id: task.projectId
    });
    if (!userProject)
        throw new NotFound_1.NotFound("User not found in this project");
    // Verify the user has "membercanapprove" role in the project or on the task
    const projectRole = String(userProject.role || "").toLowerCase();
    // Check if user is assigned to this task as membercanapprove
    const currentUserTask = await User_Task_1.UserTaskModel.findOne({
        task_id: mainTaskId,
        user_id: userId
    }).populate('rejection_reasonId', 'name points description');
    if (!currentUserTask) {
        throw new unauthorizedError_1.UnauthorizedError("You are not assigned to this task");
    }
    const userTaskRole = String(currentUserTask.role || "").toLowerCase();
    // Only membercanapprove can access this endpoint
    if (userTaskRole !== "membercanapprove" && projectRole !== "membercanapprove") {
        throw new unauthorizedError_1.UnauthorizedError("This page is exclusive for members who can approve");
    }
    // Get all team members assigned to this task
    const teamMembers = await User_Task_1.UserTaskModel.find({
        task_id: mainTaskId,
        is_active: true
    })
        .populate('user_id', 'name email photo')
        .populate('rejection_reasonId', 'name points description');
    // Get the current user's details
    const currentUser = await User_1.User.findById(userId).select('name email photo');
    // Calculate summary statistics
    const totalMembers = teamMembers.length;
    const finishedCount = teamMembers.filter(m => m.is_finished === true).length;
    const pendingCount = teamMembers.filter(m => m.status === 'pending' || m.status === 'pending_edit').length;
    const inProgressCount = teamMembers.filter(m => m.status === 'in_progress' || m.status === 'in_progress_edit').length;
    const doneCount = teamMembers.filter(m => m.status === 'done').length;
    const approvedCount = teamMembers.filter(m => m.status === 'Approved from Member_can_approve').length;
    const rejectedCount = teamMembers.filter(m => m.status === 'rejected from Member_can_rejected').length;
    // Build the response
    const response = {
        // Project Information
        project: {
            _id: task.projectId?._id || task.projectId,
            name: task.projectId?.name || "Unknown Project",
            description: task.projectId?.description || null
        },
        // Task Information
        taskInfo: {
            _id: task._id,
            name: task.name,
            description: task.description || null,
            priority: task.priority || null,
            status: task.status,
            start_date: task.start_date || null,
            end_date: task.end_date || null,
            file: task.file ? buildUrl(task.file, req) : null,
            record: task.recorde ? buildUrl(task.recorde, req) : null,
            department: task.Depatment_id ? task.Depatment_id : null,
            is_finished: task.status === 'Approved',
            createdAt: task.createdAt
        },
        // Current User (the approver) Info
        currentUser: {
            _id: currentUser?._id || userId,
            name: currentUser?.name || null,
            email: currentUser?.email || null,
            role: currentUserTask.role,
            status: currentUserTask.status,
            is_finished: currentUserTask.is_finished || false,
            userTaskId: currentUserTask._id
        },
        // Team Members List
        teamMembers: teamMembers.map(member => ({
            userTaskId: member._id,
            user: {
                _id: member.user_id?._id,
                name: member.user_id?.name || null,
                email: member.user_id?.email || null,
                photo: member.user_id?.photo ? buildUrl(member.user_id.photo, req) : null
            },
            role: member.role,
            status: member.status,
            is_finished: member.is_finished || false,
            description: member.description || null,
            start_date: member.start_date || null,
            end_date: member.end_date || null,
            rejection_reason: member.rejection_reasonId ? {
                _id: member.rejection_reasonId?._id,
                name: member.rejection_reasonId?.name,
                points: member.rejection_reasonId?.points,
                description: member.rejection_reasonId?.description
            } : null
        })),
        // Summary & Statistics
        summary: {
            totalMembers,
            finishedCount,
            pendingCount,
            inProgressCount,
            doneCount,
            approvedCount,
            rejectedCount,
            completionPercentage: totalMembers > 0
                ? Math.round((finishedCount / totalMembers) * 100)
                : 0
        }
    };
    (0, response_1.SuccessResponse)(res, {
        message: "Task details for approver fetched successfully",
        data: response
    });
};
exports.getTaskDetailsForApprover = getTaskDetailsForApprover;
const selection = async (req, res) => {
    const rejected_reason = await RejectdReson_1.RejectedReson.find();
    (0, response_1.SuccessResponse)(res, {
        message: "Rejection reasons fetched successfully",
        rejected_reason,
    });
};
exports.selection = selection;
