import { RejectedReson } from "../../models/schema/RejectdReson";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";

// --------------------------
// ADD REJECTED REASON (SaaS)
// --------------------------
export const addRejectedReson = async (req: any, res: any) => {
  const user = req.user?._id;
  if (!user) throw new UnauthorizedError("Access denied.");

  const { reason, points } = req.body;
  if (!reason || !points) throw new BadRequest("Reason and points are required");

  const newRejectedReson = await RejectedReson.create({
    reason,
    points,
    createdBy: user
  });

  SuccessResponse(res, { 
    message: "Rejected Reason added successfully",
    data: newRejectedReson 
  });
};

// --------------------------
// GET ALL (SaaS)
// --------------------------
export const getRejectedResons = async (req: any, res: any) => {
  const user = req.user?._id;
  if (!user) throw new UnauthorizedError("Access denied.");

  const reasons = await RejectedReson.find({ createdBy: user });

  SuccessResponse(res, { 
    message: "Rejected Reasons fetched successfully",
    data: reasons 
  });
};

// --------------------------
// GET BY ID (SaaS)
// --------------------------
export const getRejectedResonById = async (req: any, res: any) => {
  const user = req.user?._id;
  const { id } = req.params;

  if (!user) throw new UnauthorizedError("Access denied.");

  const reason = await RejectedReson.findOne({
    _id: id,
    createdBy: user
  });

  if (!reason) throw new NotFound("Rejected Reason not found");

  SuccessResponse(res, { 
    message: "Rejected Reason fetched successfully",
    data: reason 
  });
};

// --------------------------
// DELETE (SaaS)
// --------------------------
export const deleteRejectedResonById = async (req: any, res: any) => {
  const user = req.user?._id;
  const { id } = req.params;

  if (!user) throw new UnauthorizedError("Access denied.");

  const deleted = await RejectedReson.findOneAndDelete({
    _id: id,
    createdBy: user
  });

  if (!deleted) throw new NotFound("Rejected Reason not found");

  SuccessResponse(res, { 
    message: "Rejected Reason deleted successfully",
    data: deleted 
  });
};

// --------------------------
// UPDATE (SaaS)
// --------------------------
export const updateRejectedReson = async (req: any, res: any) => {
  const user = req.user?._id;
  const { id } = req.params;
  const { reason, points } = req.body;

  if (!user) throw new UnauthorizedError("Access denied.");

  const updated = await RejectedReson.findOneAndUpdate(
    { _id: id, createdBy: user },
    { reason, points },
    { new: true }
  );

  if (!updated) throw new NotFound("Rejected Reason not found");

  SuccessResponse(res, { 
    message: "Rejected Reason updated successfully",
    data: updated 
  });
};
