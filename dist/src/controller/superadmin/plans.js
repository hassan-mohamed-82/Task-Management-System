"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlanById = exports.deletePlanById = exports.getPlanById = exports.getAllPlans = exports.createPlan = void 0;
const plans_1 = require("../../models/schema/plans");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const response_1 = require("../../utils/response");
const createPlan = async (req, res) => {
    const { name, price_monthly, price_annually, projects_limit, members_limit } = req.body;
    if (!name) {
        throw new BadRequest_1.BadRequest("Plan name is required");
    }
    const existingPlan = await plans_1.PlanModel.findOne({ name });
    if (existingPlan) {
        throw new BadRequest_1.BadRequest("Plan with this name already exists");
    }
    const newPlan = new plans_1.PlanModel({
        name,
        price_monthly,
        price_annually,
        projects_limit,
        members_limit
    });
    await newPlan.save();
    return (0, response_1.SuccessResponse)(res, { message: "Plan created successfully", plan: newPlan });
};
exports.createPlan = createPlan;
const getAllPlans = async (req, res) => {
    const plans = await plans_1.PlanModel.find();
    return (0, response_1.SuccessResponse)(res, { message: "Plans fetched successfully", plans });
};
exports.getAllPlans = getAllPlans;
const getPlanById = async (req, res) => {
    const { id } = req.params;
    const plan = await plans_1.PlanModel.findById(id);
    if (!plan) {
        throw new NotFound_1.NotFound("Plan not found");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Plan fetched successfully", plan });
};
exports.getPlanById = getPlanById;
const deletePlanById = async (req, res) => {
    const { id } = req.params;
    const plan = await plans_1.PlanModel.findById(id);
    if (!plan) {
        throw new NotFound_1.NotFound("Plan not found");
    }
    await plans_1.PlanModel.findByIdAndDelete(id);
    return (0, response_1.SuccessResponse)(res, { message: "Plan deleted successfully" });
};
exports.deletePlanById = deletePlanById;
const updatePlanById = async (req, res) => {
    const { id } = req.params;
    const { name, price_monthly, price_annually, projects_limit, members_limit } = req.body;
    const plan = await plans_1.PlanModel.findById(id);
    if (!plan) {
        throw new NotFound_1.NotFound("Plan not found");
    }
    plan.name = name || plan.name;
    plan.price_monthly = price_monthly || plan.price_monthly;
    plan.price_annually = price_annually || plan.price_annually;
    plan.projects_limit = projects_limit || plan.projects_limit;
    plan.members_limit = members_limit || plan.members_limit;
    await plan.save();
    return (0, response_1.SuccessResponse)(res, { message: "Plan updated successfully" });
};
exports.updatePlanById = updatePlanById;
