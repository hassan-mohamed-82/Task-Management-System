"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selection = exports.reviewUserTaskByApprover = exports.getUserTaskByTaskId = exports.updateUserTaskStatus = exports.getalltaskatprojectforuser = void 0;
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
    const usertask = await User_Task_1.UserTaskModel.findOne({ task_id: taskId, user_id: userId });
    if (!usertask)
        throw new BadRequest_1.BadRequest("You are not allowed to access this project tasks");
    const userProject = await User_Project_1.UserProjectModel.findOne({ user_id: userId, project_id: task.projectId });
    if (!userProject)
        throw new NotFound_1.NotFound("User not found in this project");
    // السماح للأدوار المطلوبة فق
    const allowedRoles = ["teamlead", "member", "membercanapprove", "admin"];
    const projectRole = String(userProject.role || "").toLowerCase();
    if (!allowedRoles.includes(projectRole)) {
        throw new unauthorizedError_1.UnauthorizedError("You are not allowed to access this project tasks");
    }
    const tasks = await User_Task_1.UserTaskModel.find({ task_id: taskId, user_id: userId })
        .populate('user_id', 'name email')
        .populate('task_id', 'name description status priority start_date end_date is_finished ');
    (0, response_1.SuccessResponse)(res, { message: "Tasks found successfully", data: tasks });
};
exports.getalltaskatprojectforuser = getalltaskatprojectforuser;
const updateUserTaskStatus = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new BadRequest_1.BadRequest("User ID is required");
    const { taskId } = req.params; // ده UserTask ID
    if (!taskId)
        throw new BadRequest_1.BadRequest("Task ID is required");
    if (!mongoose_1.default.Types.ObjectId.isValid(taskId)) {
        throw new BadRequest_1.BadRequest("Invalid Task ID");
    }
    const { status, rejection_reasonId } = req.body;
    if (!status)
        throw new BadRequest_1.BadRequest("Status is required");
    // نجيب الـ UserTask ونتأكد إنها فعلاً بتاعة اليوزر ده
    const userTask = await User_Task_1.UserTaskModel.findOne({
        _id: taskId,
        user_id: userId,
    });
    if (!userTask)
        throw new NotFound_1.NotFound("UserTask not found for this user");
    const role = userTask.role; // member أو membercanapprove
    const currentStatus = userTask.status;
    // ================= تحقق من المهام المرتبطة (قبل ما نكمّل لمرحلة نهائية) =================
    // الحالات اللي محتاجة نتأكد إن الـ related tasks كلها خلصت:
    const needAllRelatedFinished = 
    // لو member عايز يحوّل التاسك التنفيذية (عادي أو edit) لـ done
    ((role === "member" || role === "membercanapprove") &&
        (currentStatus === "in_progress" || currentStatus === "in_progress_edit") &&
        status === "done") ||
        // لو membercanapprove عايز يوافق أو يرفض
        ((role === "member" || role === "membercanapprove") &&
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
    // ================= Member FLOW (تنفيذ + تعديل) =================
    if (role === "member" || role === "membercanapprove") {
        // أول مرة
        if (currentStatus === "pending" && status === "in_progress") {
            userTask.status = "in_progress";
            userTask.is_finished = false;
        }
        // إنهاء التنفيذ الأول
        else if (currentStatus === "in_progress" && status === "done") {
            userTask.status = "done";
            userTask.is_finished = true;
        }
        // بعد ما التاسك تترفُض وتتحول لـ pending_edit
        else if (currentStatus === "pending_edit" && status === "in_progress_edit") {
            userTask.status = "in_progress_edit";
            userTask.is_finished = false;
        }
        // إنهاء التعديل
        else if (currentStatus === "in_progress_edit" && status === "done") {
            userTask.status = "done";
            userTask.is_finished = true;
        }
        else {
            throw new BadRequest_1.BadRequest("Member cannot perform this status change");
        }
    }
    // ============ Membercanapprove FLOW (مراجعة فقط) ============
    else if (role === "membercanapprove") {
        // الموافقة على التاسك
        if (currentStatus === "done" && status === "Approved from Member_can_approve") {
            userTask.status = "Approved from Member_can_approve";
            userTask.is_finished = true;
        }
        // الرفض مع سبب
        else if (currentStatus === "done" &&
            status === "rejected from Member_can_rejected") {
            if (!rejection_reasonId) {
                throw new BadRequest_1.BadRequest("Rejection reason is required");
            }
            // نجيب سبب الرفض عشان نستخدم الـ points
            const rejectionReason = await RejectdReson_1.RejectedReson.findById(rejection_reasonId);
            if (!rejectionReason) {
                throw new NotFound_1.NotFound("Rejection reason not found");
            }
            // سجل سبب الرفض في UserRejectedReason
            await User_Rejection_1.UserRejectedReason.create({
                userId: userTask.user_id, // اليوزر اللي عليه التاسك
                reasonId: rejection_reasonId,
                taskId: userTask.task_id, // التاسك الكبيرة
            });
            // إضافة نقاط الرفض للـ user
            const pointsUser = await User_1.User.findById(userTask.user_id);
            if (pointsUser) {
                pointsUser.totalRejectedPoints =
                    (pointsUser.totalRejectedPoints || 0) +
                        (rejectionReason.points || 0);
                await pointsUser.save();
            }
            // تحويل جميع المرتبطين إلى pending_edit + is_finished = false
            if (userTask.User_taskId && userTask.User_taskId.length > 0) {
                await User_Task_1.UserTaskModel.updateMany({ _id: { $in: userTask.User_taskId } }, { status: "pending_edit", is_finished: false });
            }
            userTask.status = "rejected from Member_can_rejected";
            userTask.is_finished = false; // لسه محتاج تعديل
            userTask.rejection_reasonId = rejection_reasonId;
        }
        else {
            throw new BadRequest_1.BadRequest("Membercanapprove cannot perform this status change");
        }
    }
    // لو role مش member ولا membercanapprove (مفروض ما يحصلش)
    else {
        throw new BadRequest_1.BadRequest("Invalid user role for this task");
    }
    await userTask.save();
    return (0, response_1.SuccessResponse)(res, {
        message: "Task status updated successfully",
        task: userTask,
    });
};
exports.updateUserTaskStatus = updateUserTaskStatus;
const getUserTaskByTaskId = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new BadRequest_1.BadRequest("User ID is required");
    const { taskId } = req.params;
    const { filterByRole, filterByStatus } = req.query;
    if (!taskId)
        throw new BadRequest_1.BadRequest("Task ID is required");
    if (!mongoose_1.default.Types.ObjectId.isValid(taskId)) {
        throw new BadRequest_1.BadRequest("Invalid Task ID");
    }
    // 1. نجيب الـ UserTask بتاعة اليوزر الحالي (هنا taskId = UserTaskId)
    const userTask = await User_Task_1.UserTaskModel.findOne({
        _id: taskId,
        user_id: userId,
    });
    if (!userTask)
        throw new NotFound_1.NotFound("UserTask not found for this user");
    // 2. نتأكد من الصلاحيات
    const allowedRoles = ["member", "membercanapprove", "teamlead", "admin"];
    const role = String(userTask.role || "").toLowerCase();
    if (!allowedRoles.includes(role)) {
        throw new unauthorizedError_1.UnauthorizedError("You are not allowed to access this task");
    }
    // 3. بناء query ديناميكي للفلترة (على مستوى كل الـ UserTask لنفس الـ Task)
    const query = { task_id: userTask.task_id };
    if (filterByRole) {
        query.role = filterByRole;
    }
    if (filterByStatus) {
        query.status = filterByStatus;
    }
    // 4. جلب كل المستخدمين على نفس التاسك
    const allUsersOnTask = await User_Task_1.UserTaskModel.find(query)
        .populate("user_id", "name email avatar phone")
        .populate({
        path: "task_id",
        select: "name description status priority start_date end_date is_finished file recorde projectId",
        populate: {
            path: "projectId",
            select: "name description",
        },
    })
        .populate({
        path: "User_taskId",
        populate: {
            path: "user_id",
            select: "name email",
        },
    })
        .sort({ createdAt: -1 });
    // 5. استخراج تفاصيل التاسك + تحويل file / recorde لـ URL
    let taskDetails = null;
    if (allUsersOnTask.length > 0 && allUsersOnTask[0].task_id) {
        const rawTaskDoc = allUsersOnTask[0].task_id;
        const rawTask = typeof rawTaskDoc.toObject === "function"
            ? rawTaskDoc.toObject()
            : rawTaskDoc;
        // دعم إنهم يبقوا string واحدة أو array
        const file = Array.isArray(rawTask.file)
            ? rawTask.file.map((f) => buildUrl(f, req))
            : buildUrl(rawTask.file, req);
        const recorde = Array.isArray(rawTask.recorde)
            ? rawTask.recorde.map((r) => buildUrl(r, req))
            : buildUrl(rawTask.recorde, req);
        taskDetails = {
            ...rawTask,
            file,
            recorde,
        };
    }
    // 6. تنسيق بيانات أعضاء الفريق
    const teamMembers = allUsersOnTask.map((ut) => ({
        userTaskId: ut._id,
        user: ut.user_id,
        role: ut.role,
        status: ut.status,
        isFinished: ut.is_finished,
        relatedTasks: ut.User_taskId || [],
    }));
    // 7. حساب الإحصائيات
    const allTasksForStats = await User_Task_1.UserTaskModel.find({
        task_id: userTask.task_id,
    });
    const summary = {
        totalMembers: allTasksForStats.length,
        byStatus: {
            pending: allTasksForStats.filter((ut) => (ut.status || "").toLowerCase() === "pending").length,
            in_progress: allTasksForStats.filter((ut) => (ut.status || "").toLowerCase() === "in_progress").length,
            done: allTasksForStats.filter((ut) => (ut.status || "").toLowerCase() === "done").length,
            pending_edit: allTasksForStats.filter((ut) => (ut.status || "").toLowerCase() === "pending_edit").length,
            approved: allTasksForStats.filter((ut) => (ut.status || "").toLowerCase() ===
                "approved from member_can_approve").length,
            rejected: allTasksForStats.filter((ut) => (ut.status || "").toLowerCase() ===
                "rejected from member_can_rejected").length,
        },
        byRole: {
            members: allTasksForStats.filter((ut) => String(ut.role) === "member").length,
            memberCanApprove: allTasksForStats.filter((ut) => String(ut.role) === "membercanapprove").length,
            teamLead: allTasksForStats.filter((ut) => String(ut.role) === "teamlead").length,
        },
        completionRate: allTasksForStats.length > 0
            ? Math.round((allTasksForStats.filter((ut) => ut.is_finished).length /
                allTasksForStats.length) *
                100)
            : 0,
    };
    // 8. بيانات اليوزر الحالي
    const currentUserData = {
        userTaskId: userTask._id,
        role: userTask.role,
        status: userTask.status,
        isFinished: userTask.is_finished,
    };
    // 9. بناء الـ Response النهائي
    const response = {
        task: taskDetails,
        currentUser: currentUserData,
        teamMembers: teamMembers,
        summary: summary,
        filters: {
            appliedRoleFilter: filterByRole || null,
            appliedStatusFilter: filterByStatus || null,
            totalFiltered: teamMembers.length,
        },
    };
    return (0, response_1.SuccessResponse)(res, {
        message: "Task fetched successfully",
        data: response,
    });
};
exports.getUserTaskByTaskId = getUserTaskByTaskId;
const reviewUserTaskByApprover = async (req, res) => {
    const approverId = req.user?._id; // اليوزر اللي داخل (membercanapprove)
    if (!approverId)
        throw new BadRequest_1.BadRequest("User ID is required");
    const { taskId } = req.params; // ده UserTask ID لليوزر اللي بيتراجع
    if (!taskId)
        throw new BadRequest_1.BadRequest("Task ID is required");
    if (!mongoose_1.default.Types.ObjectId.isValid(taskId)) {
        throw new BadRequest_1.BadRequest("Invalid Task ID");
    }
    // نجيب الـ UserTask بتاعة اليوزر اللي بيتراجع عليه
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
    // مسموح بس بالحالتين دول
    const allowedStatuses = [
        "Approved from Member_can_approve",
        "rejected from Member_can_rejected",
    ];
    if (!status || !allowedStatuses.includes(status)) {
        throw new BadRequest_1.BadRequest("Status must be either 'Approved from Member_can_approve' or 'rejected from Member_can_rejected'");
    }
    // نجيب الـ UserTask بتاعة اليوزر اللي بيتراجع عليه
    const userTask = await User_Task_1.UserTaskModel.findById(taskId);
    if (!userTask) {
        throw new NotFound_1.NotFound("UserTask not found");
    }
    // لازم أساساً تكون done عشان نراجعها
    if (userTask.status !== "done") {
        throw new BadRequest_1.BadRequest("Task must be in 'done' status to be reviewed");
    }
    // لو حابب تمنع إن الapprover يراجع نفسه:
    // if (userTask.user_id.toString() === approverId.toString()) {
    //   throw new BadRequest("Approver cannot review his own task");
    // }
    // ================= تحقق من إن كل الـ related tasks خلصت =================
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
        // نجيب سبب الرفض عشان نستخدم الـ points
        const rejectionReason = await RejectdReson_1.RejectedReson.findById(rejection_reasonId);
        if (!rejectionReason) {
            throw new NotFound_1.NotFound("Rejection reason not found");
        }
        // سجل سبب الرفض في UserRejectedReason
        await User_Rejection_1.UserRejectedReason.create({
            userId: userTask.user_id, // اليوزر اللي عليه التاسك
            reasonId: rejection_reasonId,
            taskId: userTask.task_id, // التاسك الأصلية (الكبيرة)
            // ممكن تزود approverId لو حابب تعرف مين اللي رفض
            // approverId: approverId,
        });
        // إضافة نقاط الرفض للـ user
        const pointsUser = await User_1.User.findById(userTask.user_id);
        if (pointsUser) {
            pointsUser.totalRejectedPoints =
                (pointsUser.totalRejectedPoints || 0) +
                    (rejectionReason.points || 0);
            await pointsUser.save();
        }
        // تحويل جميع الـ related UserTasks إلى pending_edit
        if (userTask.User_taskId && userTask.User_taskId.length > 0) {
            await User_Task_1.UserTaskModel.updateMany({ _id: { $in: userTask.User_taskId } }, { status: "pending_edit", is_finished: false });
        }
        userTask.status = "rejected from Member_can_rejected";
        userTask.is_finished = false; // لسه محتاج تعديل
        userTask.rejection_reasonId = rejection_reasonId;
    }
    await userTask.save();
    return (0, response_1.SuccessResponse)(res, {
        message: "User task reviewed successfully",
        task: userTask,
    });
};
exports.reviewUserTaskByApprover = reviewUserTaskByApprover;
const selection = async (req, res) => {
    const rejected_reason = await RejectdReson_1.RejectedReson.find();
    (0, response_1.SuccessResponse)(res, {
        message: "Rejection reasons fetched successfully",
        rejected_reason,
    });
};
exports.selection = selection;
