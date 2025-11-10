import { PlanModel } from "../../models/schema/plans";
import { Request, Response } from "express";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { SuccessResponse } from "../../utils/response";

export const createPlan = async (req: Request, res: Response) => {

    const { name, price_monthly, price_annually, projects_limit, members_limit } = req.body;
    if (!name) {
        throw new BadRequest("Plan name is required");
    }

    const existingPlan = await PlanModel.findOne({ name });
    if (existingPlan) {
        throw new BadRequest("Plan with this name already exists");
    }
    const newPlan = new PlanModel({
        name,
        price_monthly,
        price_annually,
        projects_limit,
        members_limit
    });
    await newPlan.save();
    return SuccessResponse(res, { message: "Plan created successfully" , plan: newPlan });

}

export const getAllPlans = async (req: Request, res: Response) => {
    const plans = await PlanModel.find();
    return SuccessResponse(res, {message: "Plans fetched successfully", plans });
}

export const getPlanById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const plan = await PlanModel.findById(id);
    if (!plan) {
        throw new NotFound("Plan not found");
    }
    return SuccessResponse(res, {message: "Plan fetched successfully" ,plan });
}

export const deletePlanById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const plan = await PlanModel.findById(id);
    if (!plan) {
        throw new NotFound("Plan not found");
    }
    await PlanModel.findByIdAndDelete(id);
    return SuccessResponse(res, { message: "Plan deleted successfully" });
}

export const updatePlanById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, price_monthly, price_annually, projects_limit, members_limit } = req.body;
    const plan = await PlanModel.findById(id);
    if (!plan) {
        throw new NotFound("Plan not found");
    }
    plan.name = name || plan.name;
    plan.price_monthly = price_monthly || plan.price_monthly;
    plan.price_annually = price_annually || plan.price_annually;
    plan.projects_limit = projects_limit || plan.projects_limit;
    plan.members_limit = members_limit || plan.members_limit;
    await plan.save();
    return SuccessResponse(res, { message: "Plan updated successfully" });
}