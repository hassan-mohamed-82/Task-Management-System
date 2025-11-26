import { Request, Response } from "express";
import { DepartmentModel } from "../../models/schema/Department";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";

// --------------------------
// GET ALL DEPARTMENTS (SaaS)
// --------------------------
export const getAllDepartments = async (req: Request, res: Response) => {
  const user = req.user?._id;
  if (!user) throw new UnauthorizedError("Access denied.");

  const departments = await DepartmentModel.find({ createdBy: user }).lean();

  SuccessResponse(res, { 
    message: "Departments fetched successfully", 
    data: departments 
  });
};

// --------------------------
// GET DEPARTMENT BY ID (SaaS)
// --------------------------
export const getDepartmentById = async (req: Request, res: Response) => {
  const user = req.user?._id;
  const { id } = req.params;

  if (!user) throw new UnauthorizedError("Access denied.");
  if (!id) throw new BadRequest("Please provide department id");

  const department = await DepartmentModel.findOne({
    _id: id,
    createdBy: user,
  }).lean();

  if (!department) throw new NotFound("Department not found");

  SuccessResponse(res, { 
    message: "Department fetched successfully", 
    data: department 
  });
};

// --------------------------
// CREATE DEPARTMENT (SaaS)
// --------------------------
export const createDepartment = async (req: Request, res: Response) => {
  const user = req.user?._id;
  const { name } = req.body;

  if (!user) throw new UnauthorizedError("Access denied.");
  if (!name) throw new BadRequest("Please provide department name");

  const department = await DepartmentModel.create({
    name,
    createdBy: user,
  });

  SuccessResponse(res, { 
    message: "Department created successfully", 
    data: department 
  });
};

// --------------------------
// UPDATE DEPARTMENT (SaaS)
// --------------------------
export const updateDepartment = async (req: Request, res: Response) => {
  const user = req.user?._id;
  const { id } = req.params;
  const { name } = req.body;

  if (!user) throw new UnauthorizedError("Access denied.");
  if (!id) throw new BadRequest("Please provide department id");

  const department = await DepartmentModel.findOneAndUpdate(
    { _id: id, createdBy: user },
    { name },
    { new: true }
  );

  if (!department) throw new NotFound("Department not found");

  SuccessResponse(res, { 
    message: "Department updated successfully", 
    data: department 
  });
};

// --------------------------
// DELETE DEPARTMENT (SaaS)
// --------------------------
export const deleteDepartment = async (req: Request, res: Response) => {
  const user = req.user?._id;
  const { id } = req.params;

  if (!user) throw new UnauthorizedError("Access denied.");
  if (!id) throw new BadRequest("Please provide department id");

  const department = await DepartmentModel.findOneAndDelete({
    _id: id,
    createdBy: user,
  });

  if (!department) throw new NotFound("Department not found");

  SuccessResponse(res, { 
    message: "Department deleted successfully", 
    data: department 
  });
};
