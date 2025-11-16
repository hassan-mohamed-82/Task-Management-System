"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModel = void 0;
const mongoose_1 = require("mongoose");
const taskSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String },
    project_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', required: true },
    end_date: { type: Date },
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    status: {
        type: String,
        enum: ['Pending', 'in_progress', 'done', 'Approved', 'rejected'],
        default: 'Pending',
    },
    recorde: { type: String },
    file: { type: String },
    Depatment_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Department' },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
exports.TaskModel = (0, mongoose_1.model)('Task', taskSchema);
