"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const DepartmentSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true }, // << تم إزالة unique
    createdBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
exports.DepartmentModel = mongoose_1.default.model("Department", DepartmentSchema);
