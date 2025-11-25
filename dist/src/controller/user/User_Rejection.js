"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRejectionById = exports.getuserRejection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const BadRequest_1 = require("../../Errors/BadRequest");
const response_1 = require("../../utils/response");
const User_Rejection_1 = require("../../models/schema/User_Rejection");
const getuserRejection = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new BadRequest_1.BadRequest("User not authenticated");
    // التأكد من تحويل الـ userId لـ ObjectId
    const objectUserId = new mongoose_1.default.Types.ObjectId(userId);
    const userRejection = await User_Rejection_1.UserRejectedReason.find({ userId: objectUserId })
        .populate("reasonId", "reason points") // سبب الرفض ونقاطه
        .populate("userId", "name email photo") // بيانات المستخدم
        .populate("taskId", "name priority status start_date end_date"); // بيانات المهمة
    (0, response_1.SuccessResponse)(res, {
        message: "User rejection records retrieved successfully",
        userRejection
    });
};
exports.getuserRejection = getuserRejection;
const getUserRejectionById = async (req, res) => {
    const user = req.user?._id;
    const id = req.params.id;
    if (!id) {
        throw new BadRequest_1.BadRequest("Please provide user id");
    }
    const userRejection = await User_Rejection_1.UserRejectedReason.findById(id).populate("reasonId", "reason points").populate("userId", "name email photo").populate("taskId", "name priority status startDate endDate");
    (0, response_1.SuccessResponse)(res, { message: "user Rejection", userRejection });
};
exports.getUserRejectionById = getUserRejectionById;
