"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const PlanSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true, unique: true },
    price_monthly: { type: Number, },
    price_annually: { type: Number, },
    projects_limit: { type: Number, },
    members_limit: { type: Number, },
}, { timestamps: true });
exports.PlanModel = mongoose_1.default.model('Plan', PlanSchema);
