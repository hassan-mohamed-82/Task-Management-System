"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserTaskSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createUserTaskSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    task_id: joi_1.default.string().required(),
    role: joi_1.default.string().valid('member', 'membercanapprove'),
    User_taskId: joi_1.default.array().items(joi_1.default.string()).optional(),
    description: joi_1.default.string().optional(),
    status: joi_1.default.string().valid('Approved from Member_can_approve', 'Rejected from Member_can_approve').optional()
});
