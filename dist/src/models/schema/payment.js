"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const paymentSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    plan_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Plan', required: true },
    paymentmethod_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'PaymentMethod', required: true },
    amount: { type: Number, required: true },
    final_price: { type: Number }, // السعر بعد الخصم
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejected_reason: { type: String },
    code: { type: String },
    payment_date: { type: Date, required: true },
    // زي ما كانت بالضبط
    subscriptionType: {
        type: String,
        enum: ["monthly", "annually"],
        default: "quarterly"
    },
    photo: { type: String, required: true },
}, { timestamps: true });
exports.PaymentModel = mongoose_1.default.model('Payment', paymentSchema);
