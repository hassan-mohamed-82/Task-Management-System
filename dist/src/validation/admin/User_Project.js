"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProjectSchema = exports.createUserProjectSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createUserProjectSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    email: joi_1.default.string().email().optional(),
    project_id: joi_1.default.string().required(),
    role: joi_1.default.string().valid('teamlead', 'Member', 'Membercanapprove', 'admin'),
});
exports.updateUserProjectSchema = joi_1.default.object({
    role: joi_1.default.string().valid('teamlead', 'Member', 'Membercanapprove', 'admin'),
    project_id: joi_1.default.string().required(),
    user_id: joi_1.default.string().required(),
    email: joi_1.default.string().email().optional(),
});
