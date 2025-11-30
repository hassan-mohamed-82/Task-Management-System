import mongoose from "mongoose";
import { Request, Response } from "express";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { SuccessResponse } from "../../utils/response";
import { UserRejectedReason } from "../../models/schema/User_Rejection";
import { UnauthorizedError } from "../../Errors";

export const getuserRejection = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new BadRequest("User not authenticated");

  const userRejection = await UserRejectedReason.find({ userId })
    .populate("reasonId", "reason points")
    .populate({
      path: "taskId",
      model: "Task", // تأكد إن اسم الموديل "Task"
      select: "name priority status start_date end_date",
    })
    .populate("userId", "name email photo")
    .sort({ createdAt: -1 })
    .lean();

  SuccessResponse(res, {
    message: "User rejection records retrieved successfully",
    userRejection,
  });
};



export const getUserRejectionById = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { id } = req.params;

  if (!id) throw new BadRequest("Rejection ID is required");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest("Invalid rejection ID");

  // مبدئيًا نجيب الريكورد عشان نتأكد من الـ taskId قبل الـ populate (للدبج)
  const raw = await UserRejectedReason.findById(id);
  if (!raw) throw new NotFound("Rejection record not found");

  // لو مفيش taskId أصلاً في الريكورد، نرجع خطأ واضح
  if (!raw.taskId) {
    throw new NotFound("No task is linked to this rejection record");
  }

  // هنا الـ populate
  const rejection = await UserRejectedReason.findById(id)
    .populate("reasonId", "reason points") // RejectedReson
    .populate({
      path: "taskId",
      model: "Task", // اسم موديل التاسك
      select: "name priority status start_date end_date",
    })
    .populate("userId", "name email photo")
    .lean();

  if (!rejection) throw new NotFound("Rejection record not found");

  // تأكد إن اليوزر هو صاحب الريكورد
  if ((rejection.userId as any)._id.toString() !== userId?.toString()) {
    throw new UnauthorizedError("You are not allowed to view this rejection record");
  }

  // لو رغم كل ده، الـ populate رجّع taskId = null
  if (!rejection.taskId) {
    throw new NotFound("Task linked to this rejection record was not found");
  }

  SuccessResponse(res, {
    message: "Rejection record retrieved successfully",
    userRejection: rejection,
  });
};