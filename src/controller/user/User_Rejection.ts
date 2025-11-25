import mongoose from "mongoose";
import { Request, Response } from "express";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { SuccessResponse } from "../../utils/response";
import { UserRejectedReason } from "../../models/schema/User_Rejection";

export const getuserRejection = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new BadRequest("User not authenticated");

  // التأكد من تحويل الـ userId لـ ObjectId
  const objectUserId = new mongoose.Types.ObjectId(userId);

  const userRejection = await UserRejectedReason.find({ userId: objectUserId })
    .populate("reasonId", "reason points")   // سبب الرفض ونقاطه
    .populate("userId", "name email photo")   // بيانات المستخدم
    .populate("taskId", "name priority status start_date end_date"); // بيانات المهمة

  SuccessResponse(res, {
    message: "User rejection records retrieved successfully",
    userRejection
  });
};

export const getUserRejectionById = async (req: Request, res: Response) => {
  const user = req.user?._id;
 const id= req.params.id;
 if (!id) {
   throw new BadRequest("Please provide user id");
 }
  const userRejection = await UserRejectedReason.findById(id).populate("reasonId","reason points").populate("userId","name email photo").populate("taskId","name priority status startDate endDate");
  SuccessResponse(res,{message: "user Rejection", userRejection});
}
