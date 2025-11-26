"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserTaskStatus = exports.getalltaskatprojectforuser = void 0;
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
const getalltaskatprojectforuser = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new BadRequest_1.BadRequest("User ID is required");
    const { project_id } = req.params;
    if (!project_id)
        throw new BadRequest_1.BadRequest("Project ID is required");
    if (!mongoose_1.default.Types.ObjectId.isValid(project_id)) {
        throw new BadRequest_1.BadRequest("Invalid project ID");
    }
    const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
    const projectObjectId = new mongoose_1.default.Types.ObjectId(project_id);
    // جلب عضوية المستخدم في المشروع
    const userProject = await User_Project_1.UserProjectModel.findOne({
        user_id: userObjectId,
        project_id: projectObjectId,
    });
    if (!userProject) {
        throw new unauthorizedError_1.UnauthorizedError("You are not part of this project");
    }
    // السماح للأدوار المطلوبة فقط
    const allowedRoles = ["teamlead", "member", "membercanapprove", "admin"];
    const projectRole = String(userProject.role || "").toLowerCase();
    if (!allowedRoles.includes(projectRole)) {
        throw new unauthorizedError_1.UnauthorizedError("You are not allowed to access this project tasks");
    }
    // جلب كل المهام داخل المشروع باستخدام projectId الصحيح
    const projectTasks = await Tasks_1.TaskModel.find({ projectId: projectObjectId }).select("_id");
    if (!projectTasks.length)
        throw new NotFound_1.NotFound("No tasks found in this project");
    const taskIds = projectTasks.map(t => t._id);
    // جلب المهام المخصصة لهذا المستخدم داخل المشروع
    const tasks = await User_Task_1.UserTaskModel.find({
        user_id: userObjectId,
        task_id: { $in: taskIds },
    })
        .populate("user_id", "name email")
        .populate("task_id", "name");
    return (0, response_1.SuccessResponse)(res, {
        message: "Tasks fetched successfully",
        tasks,
    });
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
    // جلب الـ UserTask الحالي
    const userTask = await User_Task_1.UserTaskModel.findOne({ _id: taskId });
    if (!userTask)
        throw new NotFound_1.NotFound("UserTask not found");
    // ================= تحقق من المهام المرتبطة =================
    if (userTask.User_taskId && userTask.User_taskId.length > 0) {
        const relatedTasks = await User_Task_1.UserTaskModel.find({
            _id: { $in: userTask.User_taskId },
        });
        const allFinished = relatedTasks.every(t => t.is_finished === true);
        if (!allFinished) {
            throw new BadRequest_1.BadRequest("Some related tasks are not finished yet");
        }
    }
    const role = userTask.role; // Member أو Membercanapprove
    const currentStatus = userTask.status;
    // ================= Member =================
    if (role === "member") {
        if (currentStatus === "pending" && status === "in_progress") {
            userTask.status = "in_progress";
        }
        else if (currentStatus === "in_progress" && status === "done") {
            userTask.status = "done";
        }
        else {
            throw new BadRequest_1.BadRequest("Member cannot perform this status change");
        }
    }
    // ============ Membercanapprove ============
    if (role === "membercanapprove") {
        if (currentStatus === "done" && status === "Approved from Member_can_approve") {
            userTask.status = "Approved from Member_can_approve";
        }
        else if (currentStatus === "done" && status === "rejected") {
            if (!rejection_reasonId)
                throw new BadRequest_1.BadRequest("Rejection reason is required");
            // سجل سبب الرفض
            await User_Rejection_1.UserRejectedReason.create({
                userId,
                reasonId: rejection_reasonId,
                taskId: userTask._id,
            });
            // إضافة نقاط الرفض للـ user
            const points = await User_1.User.findOne({ _id: userId });
            if (points && rejection_reasonId.points) {
                points.totalRejectedPoints = (points.totalRejectedPoints || 0) + rejection_reasonId.points;
                await points.save();
            }
            // تحويل جميع المرتبطين إلى pending_edit
            if (userTask.User_taskId && userTask.User_taskId.length > 0) {
                await User_Task_1.UserTaskModel.updateMany({ _id: { $in: userTask.User_taskId } }, { status: "pending_edit" });
            }
            userTask.status = "rejected";
        }
        else {
            throw new BadRequest_1.BadRequest("Membercanapprove cannot perform this status change");
        }
    }
    await userTask.save();
    return (0, response_1.SuccessResponse)(res, {
        message: "Task status updated successfully",
        task: userTask,
    });
};
exports.updateUserTaskStatus = updateUserTaskStatus;
