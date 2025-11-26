"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRejectedResonSchema = exports.createRejectedResonSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createRejectedResonSchema = joi_1.default.object({
    reason: joi_1.default.string().required(),
    points: joi_1.default.number().required(),
    createdBy: joi_1.default.string().required(),
});
exports.updateRejectedResonSchema = joi_1.default.object({
    reason: joi_1.default.string().optional(),
    points: joi_1.default.number().optional(),
    createdBy: joi_1.default.string().optional(),
});
