"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyResetCode = exports.sendResetCode = exports.login = exports.verifyEmail = exports.signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = require("crypto");
const mongoose_1 = __importDefault(require("mongoose"));
const sendEmails_1 = require("../../utils/sendEmails");
const auth_1 = require("../../utils/auth");
const response_1 = require("../../utils/response");
const User_1 = require("../../models/schema/auth/User");
const emailVerifications_1 = require("../../models/schema/auth/emailVerifications");
const Errors_1 = require("../../Errors");
const BadRequest_1 = require("../../Errors/BadRequest");
// ------------------------------------
// 🔹 Helper function: send verification email
// ------------------------------------
const sendVerificationCode = async (userId, email, name, subject, messageTitle) => {
    const code = (0, crypto_1.randomInt)(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // ساعتين
    await emailVerifications_1.EmailVerificationModel.deleteMany({ userId });
    await emailVerifications_1.EmailVerificationModel.create({ userId, verificationCode: code, expiresAt });
    await (0, sendEmails_1.sendEmail)(email, subject, `Hello ${name},

${messageTitle}
Your verification code is: ${code}
(This code is valid for 2 hours)

Best regards,
Smart College Team`);
    return code;
};
// ------------------------------------
// 🧾 Signup
// ------------------------------------
const signup = async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await User_1.User.findOne({ email });
    if (existing)
        throw new Errors_1.UniqueConstrainError("Email", "User already signed up with this email");
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const newUser = await User_1.User.create({
        name,
        email,
        password: hashedPassword,
        isVerified: false,
    });
    await sendVerificationCode(new mongoose_1.default.Types.ObjectId(newUser._id), newUser.email, newUser.name, "Verify Your Email", "We received a request to verify your Smart College account.");
    return (0, response_1.SuccessResponse)(res, { message: "Signup successful, check your email for code", userId: newUser._id }, 201);
};
exports.signup = signup;
// ------------------------------------
// ✅ Verify Email
// ------------------------------------
const verifyEmail = async (req, res) => {
    const { userId, code } = req.body;
    if (!userId || !code)
        throw new BadRequest_1.BadRequest("userId and code are required");
    const record = await emailVerifications_1.EmailVerificationModel.findOne({ userId });
    if (!record)
        throw new BadRequest_1.BadRequest("No verification record found");
    if (record.verificationCode !== code)
        throw new BadRequest_1.BadRequest("Invalid verification code");
    if (record.expiresAt < new Date())
        throw new BadRequest_1.BadRequest("Verification code expired");
    await User_1.User.findByIdAndUpdate(userId, { isVerified: true });
    await emailVerifications_1.EmailVerificationModel.deleteOne({ userId });
    return (0, response_1.SuccessResponse)(res, { message: "Email verified successfully" });
};
exports.verifyEmail = verifyEmail;
// ------------------------------------
// 🔐 Login
// ------------------------------------
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        throw new BadRequest_1.BadRequest("Email and password are required");
    const user = await User_1.User.findOne({ email });
    if (!user || !user.password)
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    const isMatch = await bcrypt_1.default.compare(password, user.password);
    if (!isMatch)
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    if (!user.isVerified)
        throw new Errors_1.ForbiddenError("Verify your email first");
    const token = (0, auth_1.generateToken)({ id: user._id.toString(), name: user.name });
    return (0, response_1.SuccessResponse)(res, { message: "Login successful", token, userId: user._id, role: user.role, name: user.name }, 200);
};
exports.login = login;
// ------------------------------------
// 🔁 Send Reset Code
// ------------------------------------
const sendResetCode = async (req, res) => {
    const { email } = req.body;
    const user = await User_1.User.findOne({ email });
    if (!user)
        throw new Errors_1.NotFound("User not found");
    if (!user.isVerified)
        throw new BadRequest_1.BadRequest("User is not verified");
    const code = (0, crypto_1.randomInt)(100000, 999999).toString();
    // حذف أي كود موجود مسبقًا
    await emailVerifications_1.EmailVerificationModel.deleteMany({ userId: user._id });
    // إنشاء كود جديد
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // ساعتين
    await emailVerifications_1.EmailVerificationModel.create({
        userId: user._id,
        verificationCode: code,
        expiresAt,
    });
    await (0, sendEmails_1.sendEmail)(email, "Reset Password Code", `Hello ${user.name},

Your password reset code is: ${code}
(This code is valid for 2 hours)

Best regards,
Smart College Team`);
    (0, response_1.SuccessResponse)(res, { message: "Reset code sent to your email" }, 200);
};
exports.sendResetCode = sendResetCode;
const verifyResetCode = async (req, res) => {
    const { email, code } = req.body;
    const user = await User_1.User.findOne({ email });
    if (!user)
        throw new Errors_1.NotFound("User not found");
    const userId = user._id;
    const record = await emailVerifications_1.EmailVerificationModel.findOne({ userId });
    if (!record)
        throw new BadRequest_1.BadRequest("No reset code found");
    if (record.verificationCode !== code)
        throw new BadRequest_1.BadRequest("Invalid code");
    if (record.expiresAt < new Date())
        throw new BadRequest_1.BadRequest("Code expired");
    (0, response_1.SuccessResponse)(res, { message: "Reset code verified successfully" }, 200);
};
exports.verifyResetCode = verifyResetCode;
const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    const user = await User_1.User.findOne({ email });
    if (!user)
        throw new Errors_1.NotFound("User not found");
    const record = await emailVerifications_1.EmailVerificationModel.findOne({ userId: user._id });
    if (!record)
        throw new BadRequest_1.BadRequest("No reset code found");
    // تحديث الباسورد
    user.password = await bcrypt_1.default.hash(newPassword, 10);
    await user.save();
    // حذف سجل التحقق
    await emailVerifications_1.EmailVerificationModel.deleteOne({ userId: user._id });
    // توليد التوكن
    const token = (0, auth_1.generateToken)({
        id: user._id,
        name: user.name,
    });
    // إرسال الرد مع التوكن
    return (0, response_1.SuccessResponse)(res, { message: "Password reset successful", token }, 200);
};
exports.resetPassword = resetPassword;
