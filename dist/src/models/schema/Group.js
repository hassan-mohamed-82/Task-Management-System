"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const GroupSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Admin", required: true },
}, { timestamps: true });
exports.GroupModel = mongoose_1.default.model("Group", GroupSchema);
