import { SuccessResponse } from "../../utils/response";
import { Request, Response } from "express";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { ProjectModel } from "../../models/schema/project";
import { SubscriptionModel } from "../../models/schema/subscriptions";
import { UserProjectModel } from "../../models/schema/User_Project";
import mongoose from "mongoose";

export const createProject = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new BadRequest("User information is missing in the request");

  const { name, description } = req.body;
  if (!name) throw new BadRequest("Project name is required");

  // ✅ تحويل userId لـ ObjectId للتأكد من المطابقة
  const objectUserId = new mongoose.Types.ObjectId(userId);

  // 1️⃣ جلب الاشتراك
  const subscription = await SubscriptionModel.findOne({ userId: objectUserId }).populate("planId");
  if (!subscription) throw new BadRequest("You do not have an active subscription");
  if (subscription.status !== "active") throw new BadRequest("Your subscription is not active");

  const now = new Date();
  if (subscription.endDate < now) {
    subscription.status = "expired";
    await subscription.save();
    throw new BadRequest("Your subscription has expired");
  }

  // 2️⃣ التأكد من خطة الاشتراك
  const plan = subscription.planId as any;
  if (!plan || typeof plan.projects_limit !== "number") throw new BadRequest("Invalid plan configuration");

  // 3️⃣ التأكد من عدد المشاريع الحالية
  const currentProjectsCount = await ProjectModel.countDocuments({ createdBy: objectUserId });
  if (currentProjectsCount >= plan.projects_limit) throw new BadRequest("You have reached your project limit for this plan");

  // 4️⃣ إنشاء المشروع
  const newProject = await ProjectModel.create({
    name,
    description,
    createdBy: objectUserId,
  });

  // 5️⃣ تحديث الاشتراك
  subscription.websites_created_count = currentProjectsCount + 1;
  subscription.websites_remaining_count = plan.projects_limit - subscription.websites_created_count;
  await subscription.save();

  // 6️⃣ إضافة المستخدم كـ admin في المشروع
  await UserProjectModel.create({
    user_id: objectUserId,
    project_id: newProject._id,
    role: "admin",
    email: req.user?.email,
  });

  return SuccessResponse(res, {
    message: "Project created successfully",
    project: newProject,
  });
};

export const getAllProjects = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new BadRequest("User ID is required");

  const projects = await ProjectModel.find({ createdBy: new mongoose.Types.ObjectId(userId) });
  return SuccessResponse(res, {
    message: "Projects fetched successfully",
    projects,
  });
};

export const getProjectById = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { id } = req.params;

  if (!id) throw new BadRequest("Project ID is required");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest("Invalid Project ID");

  const project = await ProjectModel.findOne({ _id: id, createdBy: new mongoose.Types.ObjectId(userId) });
  if (!project) throw new NotFound("Project not found");

  return SuccessResponse(res, {
    message: "Project fetched successfully",
    project,
  });
};

export const updateProjectById = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { id } = req.params;
  const { name, description } = req.body;

  if (!id) throw new BadRequest("Project ID is required");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest("Invalid Project ID");

  const project = await ProjectModel.findOne({ _id: id, createdBy: new mongoose.Types.ObjectId(userId) });
  if (!project) throw new NotFound("Project not found");

  project.name = name || project.name;
  project.description = description || project.description;

  await project.save();

  return SuccessResponse(res, {
    message: "Project updated successfully",
    project,
  });
};

export const deleteProjectById = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { id } = req.params;

  if (!id) throw new BadRequest("Project ID is required");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest("Invalid Project ID");

  const project = await ProjectModel.findOne({ _id: id, createdBy: new mongoose.Types.ObjectId(userId) });
  if (!project) throw new NotFound("Project not found");

  await ProjectModel.findByIdAndDelete(id);

  return SuccessResponse(res, {
    message: "Project deleted successfully",
  });
};
