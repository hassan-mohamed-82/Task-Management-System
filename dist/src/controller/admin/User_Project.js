"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.deleteUserFromProject = exports.getAllUsersInProject = exports.addUserToProject = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const project_1 = require("../../models/schema/project");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const response_1 = require("../../utils/response");
const User_1 = require("../../models/schema/auth/User");
const User_Project_1 = require("../../models/schema/User_Project");
const sendEmails_1 = require("../../utils/sendEmails");
const addUserToProject = async (req, res) => {
    const { user_id, email, project_id, role } = req.body;
    const roles = role || "member";
    if (!project_id || (!user_id && !email)) {
        throw new BadRequest_1.BadRequest("Missing required fields (user_id or email)");
    }
    // Find user (by ID or by Email)
    let user;
    if (user_id) {
        user = await User_1.User.findById(user_id);
    }
    if (!user && email) {
        user = await User_1.User.findOne({ email });
    }
    if (!user)
        throw new NotFound_1.NotFound("User not found");
    // Check project exists
    const project = await project_1.ProjectModel.findById(project_id);
    if (!project)
        throw new NotFound_1.NotFound("Project not found");
    // Prevent duplication
    const exists = await User_Project_1.UserProjectModel.findOne({
        user_id: user._id,
        project_id,
    });
    if (exists)
        throw new BadRequest_1.BadRequest("User already added to this project");
    // Add user to project
    const userProject = await User_Project_1.UserProjectModel.create({
        user_id: user._id,
        project_id,
        email: user.email,
        role: roles,
    });
    // Send email
    await (0, sendEmails_1.sendEmail)(user.email, `You have been added to the project: ${project.name}`, `
Hello ${user.name},

You have been added to a new project.

Project Name: ${project.name}
Your Role: ${roles}

Best regards,
Task Management System
`);
    (0, response_1.SuccessResponse)(res, {
        message: "User added to project successfully",
        userProject,
    });
};
exports.addUserToProject = addUserToProject;
const getAllUsersInProject = async (req, res) => {
    const project_id = req.params.project_id;
    if (!project_id)
        throw new BadRequest_1.BadRequest("Project ID is required");
    if (!mongoose_1.default.Types.ObjectId.isValid(project_id)) {
        throw new BadRequest_1.BadRequest("Invalid project ID");
    }
    const users = await User_Project_1.UserProjectModel.find({
        project_id: new mongoose_1.default.Types.ObjectId(project_id),
    }).populate("user_id", "name email");
    return (0, response_1.SuccessResponse)(res, { message: "Users fetched successfully", users });
};
exports.getAllUsersInProject = getAllUsersInProject;
const deleteUserFromProject = async (req, res) => {
    const { user_id, project_id } = req.params;
    if (!user_id || !project_id)
        throw new BadRequest_1.BadRequest("User ID and Project ID are required");
    const userProject = await User_Project_1.UserProjectModel.findOneAndDelete({ user_id, project_id });
    if (!userProject)
        throw new NotFound_1.NotFound("User not found in project");
    return (0, response_1.SuccessResponse)(res, { message: "User removed from project successfully", userProject });
};
exports.deleteUserFromProject = deleteUserFromProject;
const updateUserRole = async (req, res) => {
    const { user_id, project_id } = req.params;
    const { role } = req.body;
    if (!user_id || !project_id || !role)
        throw new BadRequest_1.BadRequest("User ID, Project ID, and Role are required");
    const userProject = await User_Project_1.UserProjectModel.findOneAndUpdate({ user_id, project_id }, { role }, { new: true });
    if (!userProject)
        throw new NotFound_1.NotFound("User not found in project");
    return (0, response_1.SuccessResponse)(res, { message: "User role updated successfully", userProject });
};
exports.updateUserRole = updateUserRole;
