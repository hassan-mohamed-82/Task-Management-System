import { SuccessResponse } from "../../utils/response";
import { Request, Response } from "express";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { User } from "../../models/schema/auth/User";
import bcrypt from "bcrypt";
import { messaging } from "firebase-admin";

export const getAllUsers = async (req: Request, res: Response) => {
    const users = await User.find().select("-password");
    return SuccessResponse(res, {message:"All users" ,users });
}
export const getUserById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
        throw new NotFound("User not found");
    }
    return SuccessResponse(res, {message:"fetched user" , user });
}


export const createUser = async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        throw new BadRequest("Please provide all required fields");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new BadRequest("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = role || "admin";

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: userRole,
        isVerified: true,
    });
  

    return SuccessResponse(res, {message:"User created successfully" , _id: user._id, name: user.name, email: user.email, role: user.role });
};

export const updateUserById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, password, role } = req.body;
    if (!id) {
        throw new BadRequest("Please provide user id");
    }
    const user = await User.findById(id);
    if (!user) {
        throw new NotFound("User not found");
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
        user.password = await bcrypt.hash(password, 10);
    }
    if (role) user.role = role;
    await user.save();
    return SuccessResponse(res, { user });
}


export const deleteUserById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Please provide user id");
    }
    const user = await User.findById(id);
    if (!user) {
        throw new NotFound("User not found");
    }
    await User.findByIdAndDelete(id);
    return SuccessResponse(res, { message: "User deleted successfully" });
}
