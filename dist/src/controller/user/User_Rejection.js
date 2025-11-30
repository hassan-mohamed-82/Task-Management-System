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
const Errors_1 = require("../../Errors");
const getuserRejection = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new BadRequest_1.BadRequest("User not authenticated");
    const userRejection = await User_Rejection_1.UserRejectedReason.find({ userId })
        .populate("reasonId", "reason points")
        .populate({
        path: "taskId",
        model: "Task", // تأكد إن اسم الموديل "Task"
        select: "name priority status start_date end_date",
    })
        .populate("userId", "name email photo")
        .sort({ createdAt: -1 })
        .lean();
    (0, response_1.SuccessResponse)(res, {
        message: "User rejection records retrieved successfully",
        userRejection,
    });
};
exports.getuserRejection = getuserRejection;
const getUserRejectionById = async (req, res) => {
    const userId = req.user?._id;
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Rejection ID is required");
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new BadRequest_1.BadRequest("Invalid rejection ID");
    // مبدئيًا نجيب الريكورد عشان نتأكد من الـ taskId قبل الـ populate (للدبج)
    const raw = await User_Rejection_1.UserRejectedReason.findById(id);
    if (!raw)
        throw new NotFound_1.NotFound("Rejection record not found");
    // لو مفيش taskId أصلاً في الريكورد، نرجع خطأ واضح
    if (!raw.taskId) {
        throw new NotFound_1.NotFound("No task is linked to this rejection record");
    }
    // هنا الـ populate
    const rejection = await User_Rejection_1.UserRejectedReason.findById(id)
        .populate("reasonId", "reason points") // RejectedReson
        .populate({
        path: "taskId",
        model: "Task", // اسم موديل التاسك
        select: "name priority status start_date end_date",
    })
        .populate("userId", "name email photo")
        .lean();
    if (!rejection)
        throw new NotFound_1.NotFound("Rejection record not found");
    // تأكد إن اليوزر هو صاحب الريكورد
    if (rejection.userId._id.toString() !== userId?.toString()) {
        throw new Errors_1.UnauthorizedError("You are not allowed to view this rejection record");
    }
    // لو رغم كل ده، الـ populate رجّع taskId = null
    if (!rejection.taskId) {
        throw new NotFound_1.NotFound("Task linked to this rejection record was not found");
    }
    (0, response_1.SuccessResponse)(res, {
        message: "Rejection record retrieved successfully",
        userRejection: rejection,
    });
};
exports.getUserRejectionById = getUserRejectionById;
