"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlanSchema = exports.createPlanSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createPlanSchema = joi_1.default.object({
    name: joi_1.default.string().min(3).max(30).required(),
    price_monthly: joi_1.default.number().optional(),
    price_annually: joi_1.default.number().optional(),
    projects_limit: joi_1.default.number().required(),
    members_limit: joi_1.default.number().required(),
});
exports.updatePlanSchema = joi_1.default.object({
    name: joi_1.default.string().min(3).max(30).optional(),
    price_monthly: joi_1.default.number().optional(),
    price_annually: joi_1.default.number().optional(),
    projects_limit: joi_1.default.number().optional(),
    members_limit: joi_1.default.number().optional(),
});
