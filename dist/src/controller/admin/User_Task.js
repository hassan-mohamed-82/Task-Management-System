"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUserTask = exports.removedUserFromTask = exports.updateUserTaskStatus = exports.updaterole = exports.addUserToTask = void 0;
const Tasks_1 = require("../../models/schema/Tasks");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const User_1 = require("../../models/schema/auth/User");
const User_Project_1 = require("../../models/schema/User_Project");
const User_Task_1 = require("../../models/schema/User_Task");
const User_Rejection_1 = require("../../models/schema/User_Rejection");
const RejectdReson_1 = require("../../models/schema/RejectdReson");
const addUserToTask = async (req, res) => {
    const { user_id, task_id, role, User_taskId } = req.body;
    if (!user_id || !task_id)
        throw new BadRequest_1.BadRequest("User ID and Task ID are required");
    const task = await Tasks_1.TaskModel.findById(task_id);
    if (!task)
        throw new NotFound_1.NotFound("Task not found");
    const user = await User_Project_1.UserProjectModel.findOne({ user_id: user_id, project_id: task.projectId });
    if (!user)
        throw new NotFound_1.NotFound("User not found in this project");
    const userTask = await User_Task_1.UserTaskModel.findOne({ user_id: user_id, task_id: task_id });
    if (userTask)
        throw new BadRequest_1.BadRequest("User already added to this task");
    const userTaskId = await User_Task_1.UserTaskModel.create({
        user_id: user_id,
        task_id: task_id,
        role: role || 'member',
        User_taskId: User_taskId,
        status: 'pending',
    });
    (0, response_1.SuccessResponse)(res, { message: "User added to task successfully", userTaskId });
};
exports.addUserToTask = addUserToTask;
const updaterole = async (req, res) => {
    const userId = req.user?._id;
    const currentRole = String(req.user?.role || '').toLowerCase();
    if (!["admin", "teamlead"].includes(currentRole)) {
        throw new unauthorizedError_1.UnauthorizedError("Only Admin or TeamLead can add users to task");
    }
    const { id } = req.params; // UserTask ID
    const { role, user_id } = req.body;
    if (!id)
        throw new BadRequest_1.BadRequest("Task ID is required");
    // جلب المهمة
    const task = await Tasks_1.TaskModel.findById(id);
    if (!task)
        throw new NotFound_1.NotFound("Task not found");
    // التأكد أن المستخدم عضو في المشروع
    const userProject = await User_Project_1.UserProjectModel.findOne({ user_id, project_id: task.projectId });
    if (!userProject)
        throw new NotFound_1.NotFound("User not found in this project");
    // جلب UserTask
    const userTask = await User_Task_1.UserTaskModel.findOne({ user_id, task_id: id });
    if (!userTask)
        throw new NotFound_1.NotFound("UserTask not found");
    userTask.role = role;
    await userTask.save();
    (0, response_1.SuccessResponse)(res, { message: "User role updated successfully", userTask });
};
exports.updaterole = updaterole;
const updateUserTaskStatus = async (req, res) => {
    const userId = req.user?._id;
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
    const allowedStatuses = ["Approved from Member_can_approve", "done"];
    if (status === "rejected") {
        if (!rejection_reasonId)
            throw new BadRequest_1.BadRequest("Rejection reason is required");
        const rejectionReason = await RejectdReson_1.RejectedReson.findById(rejection_reasonId);
        if (!rejectionReason)
            throw new NotFound_1.NotFound("Rejection reason not found");
        await User_Rejection_1.UserRejectedReason.create({
            userId,
            reasonId: rejection_reasonId,
            taskId: userTask.task_id,
        });
        if (userTask.User_taskId && userTask.User_taskId.length > 0) {
            await User_Task_1.UserTaskModel.updateMany({ _id: { $in: userTask.User_taskId } }, { status: "pending_edit" });
        }
        userTask.status = "rejected";
        const pointsuser = await User_1.User.findById(userTask.user_id);
        if (pointsuser) {
            pointsuser.totalRejectedPoints = (pointsuser.totalRejectedPoints || 0) + (rejectionReason.points || 0);
            await pointsuser.save();
        }
        // تحديث الـ Task الرئيسي
        await Tasks_1.TaskModel.findByIdAndUpdate(userTask.task_id, {
            status: "rejected",
        });
    }
    else {
        if (!userTask.status || !allowedStatuses.includes(userTask.status)) {
            throw new BadRequest_1.BadRequest(`Cannot change status. Current status must be ${allowedStatuses.join(" or ")}`);
        }
        userTask.status = status;
        if (status === "approved" || status === "done") {
            userTask.is_finished = true;
            // تحديث الـ Task الرئيسي
            await Tasks_1.TaskModel.findByIdAndUpdate(userTask.task_id, {
                status: status,
            });
        }
    }
    await userTask.save();
    (0, response_1.SuccessResponse)(res, {
        message: "UserTask status updated successfully",
        userTask
    });
};
exports.updateUserTaskStatus = updateUserTaskStatus;
const removedUserFromTask = async (req, res) => {
    // استخراج بيانات المستخدم الحالي
    const currentRole = String(req.user?.role || "").toLowerCase();
    if (!["admin", "teamlead"].includes(currentRole)) {
        throw new unauthorizedError_1.UnauthorizedError("Only Admin or TeamLead can remove users from task");
    }
    // استخراج IDs من params
    const { user_id, task_id } = req.params;
    // البحث وحذف السطر الذي يربط هذا المستخدم بهذه المهمة
    const deletedUserTask = await User_Task_1.UserTaskModel.findOneAndDelete({
        task_id,
        user_id
    });
    if (!deletedUserTask) {
        throw new NotFound_1.NotFound("This user is not assigned to this task");
    }
    // إرسال نجاح
    (0, response_1.SuccessResponse)(res, { message: "User removed from task successfully" });
};
exports.removedUserFromTask = removedUserFromTask;
const getAllUserTask = async (req, res) => {
    const currentRole = String(req.user?.role || "").toLowerCase();
    if (!["admin", "teamlead"].includes(currentRole)) {
        throw new unauthorizedError_1.UnauthorizedError("Only Admin or TeamLead can view user tasks");
    }
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Task ID is required");
    const task = await Tasks_1.TaskModel.findById(id);
    if (!task)
        throw new NotFound_1.NotFound("Task not found");
    const userTasks = await User_Task_1.UserTaskModel.find({ task_id: id })
        .populate("user_id", "name email role"); // role هنا هو role اليوزر العادي
    const usersWithUserTaskId = userTasks.map(ut => ({
        userTaskId: ut._id,
        user: ut.user_id,
        roleInsideTask: ut.role, // 👈 أضفنا الرول داخل التاسك
        status: ut.status, // لو محتاج الحالة
        is_finished: ut.is_finished // لو محتاج الفينيش
    }));
    return (0, response_1.SuccessResponse)(res, {
        message: "User tasks fetched successfully",
        users: usersWithUserTaskId,
    });
};
exports.getAllUserTask = getAllUserTask;
// export const getalluser_task=async(req: Request, res: Response) =>{
//     const currentRole = String((req.user as any)?.role || "").toLowerCase();
//   if (!["admin", "teamlead"].includes(currentRole)) {
//     throw new UnauthorizedError("Only Admin or TeamLead can view user tasks");
//   }
//   const 
// }
