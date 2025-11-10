"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailVerificationModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const EmailVerificationSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "IUser", required: true },
    verificationCode: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });
exports.EmailVerificationModel = mongoose_1.default.model("EmailVerification", EmailVerificationSchema);
