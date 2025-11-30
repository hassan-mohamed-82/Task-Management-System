"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteprofile = exports.updateprofile = exports.getprofile = void 0;
const User_1 = require("../../models/schema/auth/User");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const getprofile = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new unauthorizedError_1.UnauthorizedError("User not authenticated");
    const user = await User_1.User.findById(userId).select("-password");
    if (!user)
        throw new NotFound_1.NotFound("User not found");
    (0, response_1.SuccessResponse)(res, { message: "User profile fetched successfully", user });
};
exports.getprofile = getprofile;
const updateprofile = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new unauthorizedError_1.UnauthorizedError("User not authenticated");
    const { name, email } = req.body;
    if (!name || !email)
        throw new BadRequest_1.BadRequest("Name and email are required");
    const user = await User_1.User.findById(userId);
    if (!user)
        throw new NotFound_1.NotFound("User not found");
    user.name = name;
    user.email = email;
    await user.save();
    (0, response_1.SuccessResponse)(res, { message: "User profile updated successfully", user });
};
exports.updateprofile = updateprofile;
const deleteprofile = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new unauthorizedError_1.UnauthorizedError("User not authenticated");
    const user = await User_1.User.findByIdAndDelete(userId);
    if (!user)
        throw new NotFound_1.NotFound("User not found");
    (0, response_1.SuccessResponse)(res, { message: "User profile deleted successfully" });
};
exports.deleteprofile = deleteprofile;
