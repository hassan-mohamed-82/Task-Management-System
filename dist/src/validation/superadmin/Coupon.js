"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCouponSchema = exports.createCouponSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createCouponSchema = joi_1.default.object({
    code: joi_1.default.string().alphanum().min(3).max(20).required(),
    start_date: joi_1.default.date().required(),
    end_date: joi_1.default.date().required(),
    discount_type: joi_1.default.string().valid('percentage', 'amount').optional(),
    discount_value: joi_1.default.number().required(),
    isActive: joi_1.default.boolean().optional(),
});
exports.updateCouponSchema = joi_1.default.object({
    code: joi_1.default.string().alphanum().min(3).max(20).optional(),
    start_date: joi_1.default.date().optional(),
    end_date: joi_1.default.date().optional(),
    discount_type: joi_1.default.string().valid('percentage', 'amount').optional(),
    discount_value: joi_1.default.number().optional(),
    isActive: joi_1.default.boolean().optional(),
});
