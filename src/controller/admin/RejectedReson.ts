import { RejectedReson } from "../../models/schema/RejectdReson";
import mongoose from "mongoose";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";

export const addRejectedReson = async (req: any, res: any) => {
    const { reason , points } = req.body;
    if (!reason || !points) throw new BadRequest("Reson and points is required");
    const newRejectedReson = await RejectedReson.create({ reason, points });
 SuccessResponse(res, { message: "RejectedReson added successfully", newRejectedReson });
};

export const getRejectedResons = async (req: any, res: any) => {
  const RejectedResons = await RejectedReson.find({});
  SuccessResponse(res, { message: "RejectedResons fetched successfully", RejectedResons });
};

export const getRejectedResonById = async (req: any, res: any) => {
  const { id } = req.params;
  const RejectedResons = await RejectedReson.findById(id);
  if (!RejectedResons) throw new NotFound("RejectedReson not found");
  SuccessResponse(res, { message: "RejectedReson fetched successfully", RejectedResons });
};

export const deleteRejectedResonById = async (req: any, res: any) => {
  const { id } = req.params;
  const RejectedResons = await RejectedReson.findByIdAndDelete(id);
  if (!RejectedResons) throw new NotFound("RejectedReson not found");
  SuccessResponse(res, { message: "RejectedReson deleted successfully", RejectedResons });
};

export const updateRejectedReson = async (req: any, res: any) => {
  const { id } = req.params;
  const { reason, points } = req.body;
  const RejectedResons = await RejectedReson.findByIdAndUpdate(id, { reason, points }, { new: true });
  if (!RejectedResons) throw new NotFound("RejectedReson not found");
  SuccessResponse(res, { message: "RejectedReson updated successfully", RejectedResons });
};