import mongoose from "mongoose";
import { Request, Response } from "express";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { SuccessResponse } from "../../utils/response";
import { UserRejectedReason } from "../../models/schema/User_Rejection";

export const getuserRejection = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new BadRequest("User not authenticated");

  const objectUserId = new mongoose.Types.ObjectId(userId);

  const userRejection = await UserRejectedReason.aggregate([
    { $match: { userId: objectUserId } },

    // Populate reasonId
    {
      $lookup: {
        from: "rejectedresons", // تأكد من اسم الـ collection
        localField: "reasonId",
        foreignField: "_id",
        as: "reason"
      }
    },
    { $unwind: { path: "$reason", preserveNullAndEmptyArrays: true } },

    // Populate taskId
    {
      $lookup: {
        from: "tasks", // اسم الـ collection للموديل Task
        localField: "taskId",
        foreignField: "_id",
        as: "task"
      }
    },
    { $unwind: { path: "$task", preserveNullAndEmptyArrays: true } },

    // Populate userId
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

    {
      $project: {
        "reason._id": 1,
        "reason.reason": 1,
        "reason.points": 1,
        "task._id": 1,
        "task.name": 1,
        "task.priority": 1,
        "task.status": 1,
        "task.start_date": 1,
        "task.end_date": 1,
        "user._id": 1,
        "user.name": 1,
        "user.email": 1,
        "user.photo": 1,
        "createdAt": 1,
        "updatedAt": 1
      }
    }
  ]);

  SuccessResponse(res, {
    message: "User rejection records retrieved successfully",
    userRejection
  });
};


export const getUserRejectionById = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { id } = req.params;

  if (!id) throw new BadRequest("Rejection ID is required");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest("Invalid rejection ID");

  const rejection = await UserRejectedReason.findById(id)
    .populate("reasonId", "reason points")
    .populate({
      path: "taskId",
      select: "name priority status start_date end_date",
    })
    .populate("userId", "name email photo")
    .lean();

  if (!rejection) throw new NotFound("Rejection record not found");

  if ((rejection.userId as any)._id.toString() !== userId?.toString()) {
    throw new BadRequest("You are not allowed to view this rejection record");
  }

  SuccessResponse(res, {
    message: "Rejection record retrieved successfully",
    userRejection: rejection
  });
};
