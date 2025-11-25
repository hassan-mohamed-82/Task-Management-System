
import mongoose from "mongoose";
import { Request, Response } from "express";
import { ProjectModel } from "../../models/schema/project";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";
import { UserProjectModel } from "../../models/schema/User_Project";
import { User } from "../../models/schema/auth/User";
import { UserTaskModel } from "../../models/schema/User_Task";
import { sendEmail } from "../../utils/sendEmails";
import { UserRejectedReason } from "../../models/schema/User_Rejection";

export const getalltaskatprojectforuser = async (req: Request, res: Response) => {
  const user = req.user?._id;
  if (!user) throw new BadRequest("User ID is required");

  const { project_id } = req.params;
  if (!project_id) throw new BadRequest("Project ID is required");

  if (!mongoose.Types.ObjectId.isValid(project_id)) {
    throw new BadRequest("Invalid project ID");
  }

  const tasks = await UserTaskModel.find({
    user_id: user
  })
  .populate({
      path: "task_id",
      match: { project_id: project_id },  // ← هنا الفلترة
      select: "name project_id"
  })
  .populate("user_id", "name email");

  // إزالة النتائج اللي task_id = null بسبب الفلترة
  const filteredTasks = tasks.filter(t => t.task_id != null);

  return SuccessResponse(res, {
    message: "Tasks fetched successfully",
    tasks: filteredTasks,
  });
};


export const updateUserTaskStatus = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new BadRequest("User ID is required");

  const { taskId } = req.params;
  if (!taskId) throw new BadRequest("Task ID is required");

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new BadRequest("Invalid Task ID");
  }

  const { status, rejection_reasonId } = req.body;
  if (!status) throw new BadRequest("Status is required");

  // جلب الـ UserTask الحالي
  const userTask = await UserTaskModel.findOne({ _id: taskId });
  if (!userTask) throw new NotFound("UserTask not found");

  // ================= تحقق من المهام المرتبطة =================
  if (userTask.User_taskId && userTask.User_taskId.length > 0) {
    const relatedTasks = await UserTaskModel.find({
      _id: { $in: userTask.User_taskId },
    });

    const allFinished = relatedTasks.every(t => t.is_finished === true);

    if (!allFinished) {
      throw new BadRequest("Some related tasks are not finished yet");
    }
  }

  const role = userTask.role; // Member أو Membercanapprove
  const currentStatus = userTask.status;

  // ================= Member =================
  if (role === "Member") {
    if (currentStatus === "pending" && status === "in_progress") {
      userTask.status = "in_progress";
    } else if (currentStatus === "in_progress" && status === "done") {
      userTask.status = "done";
    } else {
      throw new BadRequest("Member cannot perform this status change");
    }
  }

  // ============ Membercanapprove ============
  if (role === "Membercanapprove") {
    if (currentStatus === "done" && status === "Approved from Member_can_approve") {
      userTask.status = "Approved from Member_can_approve";
    } else if (currentStatus === "done" && status === "rejected") {
      if (!rejection_reasonId) throw new BadRequest("Rejection reason is required");

      // سجل سبب الرفض
      await UserRejectedReason.create({
        userId,
        reasonId: rejection_reasonId,
        taskId: userTask._id,
      });

      // إضافة نقاط الرفض للـ user
      const points = await User.findOne({ _id: userId });
      if (points && (rejection_reasonId as any).points) {
        points.totalRejectedPoints = (points.totalRejectedPoints || 0) + (rejection_reasonId as any).points;
        await points.save();
      }

      // تحويل جميع المرتبطين إلى pending_edit
      if (userTask.User_taskId && userTask.User_taskId.length > 0) {
        await UserTaskModel.updateMany(
          { _id: { $in: userTask.User_taskId } },
          { status: "pending_edit" }
        );
      }

      userTask.status = "rejected";
    } else {
      throw new BadRequest("Membercanapprove cannot perform this status change");
    }
  }

  await userTask.save();

  return SuccessResponse(res, {
    message: "Task status updated successfully",
    task: userTask,
  });
};



