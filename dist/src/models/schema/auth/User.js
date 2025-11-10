"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
    },
    googleId: { type: String, unique: true, sparse: true },
}, { timestamps: true });
exports.User = (0, mongoose_1.model)('User', userSchema);
