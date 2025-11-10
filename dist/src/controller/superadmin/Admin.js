"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserById = exports.updateUserById = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const User_1 = require("../../models/schema/auth/User");
const bcrypt_1 = __importDefault(require("bcrypt"));
const getAllUsers = async (req, res) => {
    const users = await User_1.User.find().select("-password");
    return (0, response_1.SuccessResponse)(res, { message: "All users", users });
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    const { id } = req.params;
    const user = await User_1.User.findById(id).select("-password");
    if (!user) {
        throw new NotFound_1.NotFound("User not found");
    }
    return (0, response_1.SuccessResponse)(res, { message: "fetched user", user });
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        throw new BadRequest_1.BadRequest("Please provide all required fields");
    }
    const existingUser = await User_1.User.findOne({ email });
    if (existingUser) {
        throw new BadRequest_1.BadRequest("User with this email already exists");
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const userRole = role || "admin";
    const user = await User_1.User.create({
        name,
        email,
        password: hashedPassword,
        role: userRole,
        isVerified: true,
    });
    return (0, response_1.SuccessResponse)(res, { message: "User created successfully", _id: user._id, name: user.name, email: user.email, role: user.role });
};
exports.createUser = createUser;
const updateUserById = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role } = req.body;
    if (!id) {
        throw new BadRequest_1.BadRequest("Please provide user id");
    }
    const user = await User_1.User.findById(id);
    if (!user) {
        throw new NotFound_1.NotFound("User not found");
    }
    if (name)
        user.name = name;
    if (email)
        user.email = email;
    if (password) {
        user.password = await bcrypt_1.default.hash(password, 10);
    }
    if (role)
        user.role = role;
    await user.save();
    return (0, response_1.SuccessResponse)(res, { user });
};
exports.updateUserById = updateUserById;
const deleteUserById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest_1.BadRequest("Please provide user id");
    }
    const user = await User_1.User.findById(id);
    if (!user) {
        throw new NotFound_1.NotFound("User not found");
    }
    await User_1.User.findByIdAndDelete(id);
    return (0, response_1.SuccessResponse)(res, { message: "User deleted successfully" });
};
exports.deleteUserById = deleteUserById;
