"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.updateDepartment = exports.createDepartment = exports.getDepartmentById = exports.getAllDepartments = void 0;
const Department_1 = require("../../models/schema/Department");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
// --------------------------
// GET ALL DEPARTMENTS (SaaS)
// --------------------------
const getAllDepartments = async (req, res) => {
    const user = req.user?._id;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError("Access denied.");
    const departments = await Department_1.DepartmentModel.find({ createdBy: user }).lean();
    (0, response_1.SuccessResponse)(res, {
        message: "Departments fetched successfully",
        data: departments
    });
};
exports.getAllDepartments = getAllDepartments;
// --------------------------
// GET DEPARTMENT BY ID (SaaS)
// --------------------------
const getDepartmentById = async (req, res) => {
    const user = req.user?._id;
    const { id } = req.params;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError("Access denied.");
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide department id");
    const department = await Department_1.DepartmentModel.findOne({
        _id: id,
        createdBy: user,
    }).lean();
    if (!department)
        throw new NotFound_1.NotFound("Department not found");
    (0, response_1.SuccessResponse)(res, {
        message: "Department fetched successfully",
        data: department
    });
};
exports.getDepartmentById = getDepartmentById;
// --------------------------
// CREATE DEPARTMENT (SaaS)
// --------------------------
const createDepartment = async (req, res) => {
    const user = req.user?._id;
    const { name } = req.body;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError("Access denied.");
    if (!name)
        throw new BadRequest_1.BadRequest("Please provide department name");
    const department = await Department_1.DepartmentModel.create({
        name,
        createdBy: user,
    });
    (0, response_1.SuccessResponse)(res, {
        message: "Department created successfully",
        data: department
    });
};
exports.createDepartment = createDepartment;
// --------------------------
// UPDATE DEPARTMENT (SaaS)
// --------------------------
const updateDepartment = async (req, res) => {
    const user = req.user?._id;
    const { id } = req.params;
    const { name } = req.body;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError("Access denied.");
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide department id");
    const department = await Department_1.DepartmentModel.findOneAndUpdate({ _id: id, createdBy: user }, { name }, { new: true });
    if (!department)
        throw new NotFound_1.NotFound("Department not found");
    (0, response_1.SuccessResponse)(res, {
        message: "Department updated successfully",
        data: department
    });
};
exports.updateDepartment = updateDepartment;
// --------------------------
// DELETE DEPARTMENT (SaaS)
// --------------------------
const deleteDepartment = async (req, res) => {
    const user = req.user?._id;
    const { id } = req.params;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError("Access denied.");
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide department id");
    const department = await Department_1.DepartmentModel.findOneAndDelete({
        _id: id,
        createdBy: user,
    });
    if (!department)
        throw new NotFound_1.NotFound("Department not found");
    (0, response_1.SuccessResponse)(res, {
        message: "Department deleted successfully",
        data: department
    });
};
exports.deleteDepartment = deleteDepartment;
