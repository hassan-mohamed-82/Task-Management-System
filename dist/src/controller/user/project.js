"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getallProject = exports.getProjectDetailsForUser = void 0;
const project_1 = require("../../models/schema/project");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const User_Project_1 = require("../../models/schema/User_Project");
const User_Task_1 = require("../../models/schema/User_Task");
const getProjectDetailsForUser = async (req, res) => {
    const userId = req.user?._id; // استخدم _id من الـ user
    const { project_id } = req.params;
    if (!userId || !project_id)
        throw new BadRequest_1.BadRequest("User ID or Project ID missing");
    // التأكد أن المستخدم عضو في المشروع
    const isMember = await User_Project_1.UserProjectModel.findOne({ userId, project_id });
    if (!isMember)
        throw new unauthorizedError_1.UnauthorizedError("You are not part of this project");
    // جلب بيانات المشروع
    const project = await project_1.ProjectModel.findById(project_id);
    if (!project)
        throw new NotFound_1.NotFound("Project not found");
    // جلب أعضاء المشروع
    const members = await User_Project_1.UserProjectModel.find({ project_id })
        .populate("userId", "name email photo role"); // populate مع الحقل الصحيح
    // جلب مهام المستخدم داخل المشروع
    const tasks = await User_Task_1.UserTaskModel.find({ userId })
        .populate({
        path: "task_id",
        match: { projectId: project_id } // فلترة على المشروع
    });
    (0, response_1.SuccessResponse)(res, {
        message: "Project details retrieved",
        project,
        members,
        tasks
    });
};
exports.getProjectDetailsForUser = getProjectDetailsForUser;
const getallProject = async (req, res) => {
    const userId = req.user?._id;
    const projects = await User_Project_1.UserProjectModel.find({ userId }).populate("project_id", "name");
    return (0, response_1.SuccessResponse)(res, { message: "Projects fetched successfully", projects });
};
exports.getallProject = getallProject;
