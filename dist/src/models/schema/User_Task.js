"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTaskModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UserTaskSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    task_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Task",
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'done', 'pending_edit', "in_progress_edit", 'Approved from Member_can_approve', 'rejected', 'approved'],
        required: true,
    },
    is_finished: {
        type: Boolean,
        default: false,
    },
    rejection_reasonId: {
        type: mongoose_1.Schema.Types.ObjectId, // سبب الرفض لو الحالة rejected
        ref: "RejectedReson",
    },
    role: {
        type: String,
        enum: ['member', 'membercanapprove'],
        default: 'member',
    },
    User_taskId: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User_Task",
        }]
}, { timestamps: true });
exports.UserTaskModel = mongoose_1.default.model("User_Task", UserTaskSchema);
