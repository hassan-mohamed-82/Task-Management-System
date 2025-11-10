"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const Errors_1 = require("../Errors");
dotenv_1.default.config();
// 🎯 توليد التوكن (لأي نوع مستخدم)
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user._id?.toString() || user.id?.toString(),
        name: user.name,
        role: user.role || "user", // افتراضي لو مش محدد
        email: user.email,
        isVerified: user.isVerified ?? true, // الافتراضي أنه متحقق
    }, process.env.JWT_SECRET, { expiresIn: "7d" });
};
exports.generateToken = generateToken;
// 🎯 التحقق من التوكن (يرجع بيانات المستخدم)
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        return {
            id: decoded.id,
            name: decoded.name,
            role: decoded.role,
            email: decoded.email,
            isVerified: decoded.isVerified,
        };
    }
    catch (error) {
        throw new Errors_1.UnauthorizedError("Invalid or expired token");
    }
};
exports.verifyToken = verifyToken;
