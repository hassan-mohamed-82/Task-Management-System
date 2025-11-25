"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRejectionById = exports.getuserRejection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const response_1 = require("../../utils/response");
const User_Rejection_1 = require("../../models/schema/User_Rejection");
const getuserRejection = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new BadRequest_1.BadRequest("User not authenticated");
    const objectUserId = new mongoose_1.default.Types.ObjectId(userId);
    const userRejection = await User_Rejection_1.UserRejectedReason.aggregate([
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
        // Populate userId
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userId"
            }
        },
        { $unwind: "$userId" },
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
    (0, response_1.SuccessResponse)(res, {
        message: "User rejection records retrieved successfully",
        userRejection
    });
};
exports.getuserRejection = getuserRejection;
const getUserRejectionById = async (req, res) => {
    const userId = req.user?._id;
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Rejection ID is required");
    // Validate ID
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new BadRequest_1.BadRequest("Invalid rejection ID");
    }
    // Fetch rejection record
    const rejection = await User_Rejection_1.UserRejectedReason.findById(id)
        .populate("reasonId", "reason points")
        .populate("userId", "name email photo")
        .populate("taskId", "name priority status start_date end_date");
    if (!rejection) {
        throw new NotFound_1.NotFound("Rejection record not found");
    }
    // Make sure this rejection belongs to the logged-in user
    if (rejection.userId.toString() !== userId?.toString()) {
        throw new BadRequest_1.BadRequest("You are not allowed to view this rejection record");
    }
    return (0, response_1.SuccessResponse)(res, {
        message: "Rejection record retrieved successfully",
        userRejection: rejection
    });
};
exports.getUserRejectionById = getUserRejectionById;
