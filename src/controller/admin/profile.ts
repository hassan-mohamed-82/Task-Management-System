import { Request, Response } from "express";
import { User } from "../../models/schema/auth/User";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";

export const getprofile = async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedError("User not authenticated");
    const user = await User.findById(userId).select("-password");
    if (!user) throw new NotFound("User not found");
    SuccessResponse(res, { message: "User profile fetched successfully", user });
}

export const updateprofile = async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedError("User not authenticated");
    const { name, email } = req.body;
    if (!name || !email) throw new BadRequest("Name and email are required");
    const user = await User.findById(userId);
    if (!user) throw new NotFound("User not found");
    user.name = name;
    user.email = email;
    await user.save();
    SuccessResponse(res, { message: "User profile updated successfully", user });
}

export const deleteprofile = async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedError("User not authenticated");
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new NotFound("User not found");
    SuccessResponse(res, { message: "User profile deleted successfully" });
}

