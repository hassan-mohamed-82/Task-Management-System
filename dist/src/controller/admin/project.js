"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProjectById = exports.updateProjectById = exports.getProjectById = exports.getAllProjects = exports.createProject = void 0;
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const project_1 = require("../../models/schema/project");
const subscriptions_1 = require("../../models/schema/subscriptions");
const User_Project_1 = require("../../models/schema/User_Project");
const mongoose_1 = __importDefault(require("mongoose"));
const User_Task_1 = require("../../models/schema/User_Task");
const Tasks_1 = require("../../models/schema/Tasks");
const createProject = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new BadRequest_1.BadRequest("User information is missing in the request");
    const { name, description } = req.body;
    if (!name)
        throw new BadRequest_1.BadRequest("Project name is required");
    // ✅ تحويل userId لـ ObjectId للتأكد من المطابقة
    const objectUserId = new mongoose_1.default.Types.ObjectId(userId);
    // 1️⃣ جلب الاشتراك الأحدث والنشط
    const subscription = await subscriptions_1.SubscriptionModel.findOne({
        userId: objectUserId,
        status: "active"
    })
        .sort({ createdAt: -1 })
        .populate("planId");
    if (!subscription) {
        // Check if user has any subscription at all
        const anySubscription = await subscriptions_1.SubscriptionModel.findOne({ userId: objectUserId });
        if (!anySubscription) {
            throw new BadRequest_1.BadRequest("You do not have any subscription");
        }
        throw new BadRequest_1.BadRequest("Your subscription is not active or has expired");
    }
    const now = new Date();
    if (subscription.endDate < now) {
        subscription.status = "expired";
        await subscription.save();
        throw new BadRequest_1.BadRequest("Your subscription has expired");
    }
    // 2️⃣ التأكد من خطة الاشتراك
    const plan = subscription.planId;
    if (!plan || typeof plan.projects_limit !== "number")
        throw new BadRequest_1.BadRequest("Invalid plan configuration");
    // 3️⃣ التأكد من عدد المشاريع الحالية
    const currentProjectsCount = await project_1.ProjectModel.countDocuments({ createdBy: objectUserId });
    if (currentProjectsCount >= plan.projects_limit)
        throw new BadRequest_1.BadRequest("You have reached your project limit for this plan");
    // 4️⃣ إنشاء المشروع
    const newProject = await project_1.ProjectModel.create({
        name,
        description,
        createdBy: objectUserId,
    });
    // 5️⃣ تحديث الاشتراك
    subscription.websites_created_count = currentProjectsCount + 1;
    subscription.websites_remaining_count = plan.projects_limit - subscription.websites_created_count;
    await subscription.save();
    // 6️⃣ إضافة المستخدم كـ admin في المشروع
    await User_Project_1.UserProjectModel.create({
        user_id: objectUserId,
        project_id: newProject._id,
        role: "admin",
        email: req.user?.email,
    });
    return (0, response_1.SuccessResponse)(res, {
        message: "Project created successfully",
        project: newProject,
    });
};
exports.createProject = createProject;
const getAllProjects = async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new BadRequest_1.BadRequest("User ID is required");
    const projects = await project_1.ProjectModel.find({ createdBy: new mongoose_1.default.Types.ObjectId(userId) });
    return (0, response_1.SuccessResponse)(res, {
        message: "Projects fetched successfully",
        projects,
    });
};
exports.getAllProjects = getAllProjects;
const getProjectById = async (req, res) => {
    const userId = req.user?._id;
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Project ID is required");
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new BadRequest_1.BadRequest("Invalid Project ID");
    const project = await project_1.ProjectModel.findOne({ _id: id, createdBy: new mongoose_1.default.Types.ObjectId(userId) });
    if (!project)
        throw new NotFound_1.NotFound("Project not found");
    return (0, response_1.SuccessResponse)(res, {
        message: "Project fetched successfully",
        project,
    });
};
exports.getProjectById = getProjectById;
const updateProjectById = async (req, res) => {
    const userId = req.user?._id;
    const { id } = req.params;
    const { name, description } = req.body;
    if (!id)
        throw new BadRequest_1.BadRequest("Project ID is required");
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new BadRequest_1.BadRequest("Invalid Project ID");
    const project = await project_1.ProjectModel.findOne({ _id: id, createdBy: new mongoose_1.default.Types.ObjectId(userId) });
    if (!project)
        throw new NotFound_1.NotFound("Project not found");
    project.name = name || project.name;
    project.description = description || project.description;
    await project.save();
    return (0, response_1.SuccessResponse)(res, {
        message: "Project updated successfully",
        project,
    });
};
exports.updateProjectById = updateProjectById;
const deleteProjectById = async (req, res) => {
    const userId = req.user?._id;
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Project ID is required");
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new BadRequest_1.BadRequest("Invalid Project ID");
    const project = await project_1.ProjectModel.findOne({ _id: id, createdBy: new mongoose_1.default.Types.ObjectId(userId) });
    if (!project)
        throw new NotFound_1.NotFound("Project not found");
    // 1. Get all tasks for this project
    const projectTasks = await Tasks_1.TaskModel.find({ projectId: id });
    const taskIds = projectTasks.map(t => t._id);
    // 2. Delete all UserTasks linked to those tasks
    if (taskIds.length > 0) {
        await User_Task_1.UserTaskModel.deleteMany({ task_id: { $in: taskIds } });
    }
    // 3. Delete all Tasks for this project
    await Tasks_1.TaskModel.deleteMany({ projectId: id });
    // 4. Delete all UserProjects for this project
    await User_Project_1.UserProjectModel.deleteMany({ project_id: id });
    // 5. Delete the Project
    await project_1.ProjectModel.findByIdAndDelete(id);
    return (0, response_1.SuccessResponse)(res, {
        message: "Project and all related data deleted successfully",
    });
};
exports.deleteProjectById = deleteProjectById;
