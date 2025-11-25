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
        from: "rejectedresons",
        localField: "reasonId",
        foreignField: "_id",
        as: "reasonId"
      }
    },
    { $unwind: "$reasonId" },

    // Populate userId without password
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userId"
      }
    },
    { $unwind: "$userId" },
    {
      $project: {
        "reasonId": 1,
        "taskId": 1,
        "userId._id": 1,
        "userId.name": 1,
        "userId.email": 1,
        "userId.photo": 1,
        "createdAt": 1,
        "updatedAt": 1
        // كلمة السر مش موجودة هنا → ما هتظهرش
      }
    },

    // Populate taskId
    {
      $lookup: {
        from: "tasks",
        localField: "taskId",
        foreignField: "_id",
        as: "taskId"
      }
    },
    { $unwind: "$taskId" }
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

  // Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequest("Invalid rejection ID");
  }

  // Fetch rejection record
  const rejection = await UserRejectedReason.findById(id)
    .populate("reasonId", "reason points")
    .populate("userId", "name email photo")
    .populate("taskId", "name priority status start_date end_date");

  if (!rejection) {
    throw new NotFound("Rejection record not found");
  }

  // Make sure this rejection belongs to the logged-in user
  if (rejection.userId.toString() !== userId?.toString()) {
    throw new BadRequest("You are not allowed to view this rejection record");
  }

  return SuccessResponse(res, {
    message: "Rejection record retrieved successfully",
    userRejection: rejection
  });
};
