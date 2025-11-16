"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateuserRole = exports.deleteUserFromProject = exports.getUsersByProject = exports.addUserToProject = void 0;
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const response_1 = require("../../utils/response");
const User_1 = require("../../models/schema/auth/User");
const User_Project_1 = require("../../models/schema/User_Project");
const sendEmails_1 = require("../../utils/sendEmails");
const addUserToProject = async (req, res) => {
    const { user_id, project_id, role, email } = req.body;
    let roles = role || "member"; // declare role as a let variable
    if (!user_id || !project_id) {
        throw new BadRequest_1.BadRequest("Missing required fields");
    }
    const user = await User_1.User.findById(user_id);
    if (!user) {
        throw new NotFound_1.NotFound("User not found");
    }
    const project = await User_Project_1.UserProjectModel.findById(project_id);
    if (!project) {
        throw new NotFound_1.NotFound("Project not found");
    }
    const userProject = await User_Project_1.UserProjectModel.create({ user_id, project_id, role: roles });
    (0, sendEmails_1.sendEmail)(user.email, "User Added to Project", `You have been added to a project as a ${roles}.`);
    return (0, response_1.SuccessResponse)(res, { message: "User added to project successfully", userProject });
};
exports.addUserToProject = addUserToProject;
const getUsersByProject = async (req, res) => {
    const { project_id } = req.params;
    if (!project_id) {
        throw new BadRequest_1.BadRequest("Project ID is required");
    }
    const users = await User_Project_1.UserProjectModel.find({ project_id }).populate("user_id", "name email photo");
    return (0, response_1.SuccessResponse)(res, { message: "Users fetched successfully", users });
};
exports.getUsersByProject = getUsersByProject;
const deleteUserFromProject = async (req, res) => {
    const { user_id, project_id } = req.params;
    if (!user_id || !project_id) {
        throw new BadRequest_1.BadRequest("User ID and Project ID are required");
    }
    const userProject = await User_Project_1.UserProjectModel.findOneAndDelete({ user_id, project_id });
    if (!userProject) {
        throw new NotFound_1.NotFound("User not found in project");
    }
    return (0, response_1.SuccessResponse)(res, { message: "User removed from project successfully", userProject });
};
exports.deleteUserFromProject = deleteUserFromProject;
const updateuserRole = async (req, res) => {
    const { user_id, project_id } = req.params;
    const { role } = req.body;
    if (!user_id || !project_id || !role) {
        throw new BadRequest_1.BadRequest("User ID, Project ID, and Role are required");
    }
    const userProject = await User_Project_1.UserProjectModel.findOneAndUpdate({ user_id, project_id }, { role }, { new: true });
    if (!userProject) {
        throw new NotFound_1.NotFound("User not found in project");
    }
    return (0, response_1.SuccessResponse)(res, { message: "User role updated successfully", userProject });
};
exports.updateuserRole = updateuserRole;
