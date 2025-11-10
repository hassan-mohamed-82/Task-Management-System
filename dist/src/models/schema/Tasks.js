"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModel = void 0;
const mongoose_1 = require("mongoose");
const taskSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String },
    project: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedTo: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    status: {
        type: String,
        enum: ['todo', 'in_progress', 'done', 'blocked'],
        default: 'todo',
    },
    dueDate: { type: Date },
    attachments: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Attachment' }],
}, { timestamps: true });
exports.TaskModel = (0, mongoose_1.model)('Task', taskSchema);
