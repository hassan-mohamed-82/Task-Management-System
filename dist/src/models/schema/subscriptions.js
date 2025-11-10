"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const SubscriptionSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Plan', required: true },
    PaymentId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Payment', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    websites_created_count: { type: Number, default: 0 },
    websites_remaining_count: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "expired"], default: "active" }
}, { timestamps: true });
exports.SubscriptionModel = mongoose_1.default.model('Subscription', SubscriptionSchema);
