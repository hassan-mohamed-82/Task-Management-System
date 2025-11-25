"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskSchema = exports.createTaskSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createTaskSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    description: joi_1.default.string().optional(),
    projectId: joi_1.default.string().required(),
    end_date: joi_1.default.date().optional(),
    priority: joi_1.default.string().valid('low', 'medium', 'high').optional(),
    status: joi_1.default.string().valid('Pending', 'in_progress', 'done', 'Approved', 'rejected').default('Pending'),
    Depatment_id: joi_1.default.string().optional(),
    userId: joi_1.default.string().optional(),
    file: joi_1.default.any().optional(),
    recorde: joi_1.default.any().optional(),
});
exports.updateTaskSchema = joi_1.default.object({
    name: joi_1.default.string().optional(),
    description: joi_1.default.string().optional(),
    projectId: joi_1.default.string().optional(),
    end_date: joi_1.default.date().optional(),
    priority: joi_1.default.string().valid('low', 'medium', 'high').optional(),
    status: joi_1.default.string().valid('Pending', 'in_progress', 'done', 'Approved', 'rejected').optional(),
    Depatment_id: joi_1.default.string().optional(),
    file: joi_1.default.any().optional(),
    recorde: joi_1.default.any().optional(),
});
