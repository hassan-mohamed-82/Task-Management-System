"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRejectedReson = exports.deleteRejectedResonById = exports.getRejectedResonById = exports.getRejectedResons = exports.addRejectedReson = void 0;
const RejectdReson_1 = require("../../models/schema/RejectdReson");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const response_1 = require("../../utils/response");
const addRejectedReson = async (req, res) => {
    const { reason, points } = req.body;
    if (!reason || !points)
        throw new BadRequest_1.BadRequest("Reson and points is required");
    const newRejectedReson = await RejectdReson_1.RejectedReson.create({ reason, points });
    (0, response_1.SuccessResponse)(res, { message: "RejectedReson added successfully", newRejectedReson });
};
exports.addRejectedReson = addRejectedReson;
const getRejectedResons = async (req, res) => {
    const RejectedResons = await RejectdReson_1.RejectedReson.find({});
    (0, response_1.SuccessResponse)(res, { message: "RejectedResons fetched successfully", RejectedResons });
};
exports.getRejectedResons = getRejectedResons;
const getRejectedResonById = async (req, res) => {
    const { id } = req.params;
    const RejectedResons = await RejectdReson_1.RejectedReson.findById(id);
    if (!RejectedResons)
        throw new NotFound_1.NotFound("RejectedReson not found");
    (0, response_1.SuccessResponse)(res, { message: "RejectedReson fetched successfully", RejectedResons });
};
exports.getRejectedResonById = getRejectedResonById;
const deleteRejectedResonById = async (req, res) => {
    const { id } = req.params;
    const RejectedResons = await RejectdReson_1.RejectedReson.findByIdAndDelete(id);
    if (!RejectedResons)
        throw new NotFound_1.NotFound("RejectedReson not found");
    (0, response_1.SuccessResponse)(res, { message: "RejectedReson deleted successfully", RejectedResons });
};
exports.deleteRejectedResonById = deleteRejectedResonById;
const updateRejectedReson = async (req, res) => {
    const { id } = req.params;
    const { reason, points } = req.body;
    const RejectedResons = await RejectdReson_1.RejectedReson.findByIdAndUpdate(id, { reason, points }, { new: true });
    if (!RejectedResons)
        throw new NotFound_1.NotFound("RejectedReson not found");
    (0, response_1.SuccessResponse)(res, { message: "RejectedReson updated successfully", RejectedResons });
};
exports.updateRejectedReson = updateRejectedReson;
