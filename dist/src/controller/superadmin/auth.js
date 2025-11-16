"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const BadRequest_1 = require("../../Errors/BadRequest");
const Errors_1 = require("../../Errors");
const SuperAdmin_1 = require("../../models/schema/auth/SuperAdmin");
const auth_1 = require("../../utils/auth");
const response_1 = require("../../utils/response");
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new BadRequest_1.BadRequest("Email and password are required");
    }
    // ✅ استخدم النوع الصح هنا
    const user = await SuperAdmin_1.SuperAdminModel.findOne({ email });
    if (!user) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    const isMatch = await bcrypt_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    const token = (0, auth_1.generateToken)({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: true,
    });
    return (0, response_1.SuccessResponse)(res, {
        message: "Login successful",
        token,
        user: {
            name: user.name,
            email: user.email,
            role: user.role,
        },
    }, 200);
};
exports.login = login;
