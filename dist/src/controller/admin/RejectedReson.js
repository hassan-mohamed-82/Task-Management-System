"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRejectedReson = exports.deleteRejectedResonById = exports.getRejectedResonById = exports.getRejectedResons = exports.addRejectedReson = void 0;
const RejectdReson_1 = require("../../models/schema/RejectdReson");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
// --------------------------
// ADD REJECTED REASON (SaaS)
// --------------------------
const addRejectedReson = async (req, res) => {
    const user = req.user?._id;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError("Access denied.");
    const { reason, points } = req.body;
    if (!reason || !points)
        throw new BadRequest_1.BadRequest("Reason and points are required");
    const newRejectedReson = await RejectdReson_1.RejectedReson.create({
        reason,
        points,
        createdBy: user
    });
    (0, response_1.SuccessResponse)(res, {
        message: "Rejected Reason added successfully",
        data: newRejectedReson
    });
};
exports.addRejectedReson = addRejectedReson;
// --------------------------
// GET ALL (SaaS)
// --------------------------
const getRejectedResons = async (req, res) => {
    const user = req.user?._id;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError("Access denied.");
    const reasons = await RejectdReson_1.RejectedReson.find({ createdBy: user });
    (0, response_1.SuccessResponse)(res, {
        message: "Rejected Reasons fetched successfully",
        data: reasons
    });
};
exports.getRejectedResons = getRejectedResons;
// --------------------------
// GET BY ID (SaaS)
// --------------------------
const getRejectedResonById = async (req, res) => {
    const user = req.user?._id;
    const { id } = req.params;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError("Access denied.");
    const reason = await RejectdReson_1.RejectedReson.findOne({
        _id: id,
        createdBy: user
    });
    if (!reason)
        throw new NotFound_1.NotFound("Rejected Reason not found");
    (0, response_1.SuccessResponse)(res, {
        message: "Rejected Reason fetched successfully",
        data: reason
    });
};
exports.getRejectedResonById = getRejectedResonById;
// --------------------------
// DELETE (SaaS)
// --------------------------
const deleteRejectedResonById = async (req, res) => {
    const user = req.user?._id;
    const { id } = req.params;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError("Access denied.");
    const deleted = await RejectdReson_1.RejectedReson.findOneAndDelete({
        _id: id,
        createdBy: user
    });
    if (!deleted)
        throw new NotFound_1.NotFound("Rejected Reason not found");
    (0, response_1.SuccessResponse)(res, {
        message: "Rejected Reason deleted successfully",
        data: deleted
    });
};
exports.deleteRejectedResonById = deleteRejectedResonById;
// --------------------------
// UPDATE (SaaS)
// --------------------------
const updateRejectedReson = async (req, res) => {
    const user = req.user?._id;
    const { id } = req.params;
    const { reason, points } = req.body;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError("Access denied.");
    const updated = await RejectdReson_1.RejectedReson.findOneAndUpdate({ _id: id, createdBy: user }, { reason, points }, { new: true });
    if (!updated)
        throw new NotFound_1.NotFound("Rejected Reason not found");
    (0, response_1.SuccessResponse)(res, {
        message: "Rejected Reason updated successfully",
        data: updated
    });
};
exports.updateRejectedReson = updateRejectedReson;
