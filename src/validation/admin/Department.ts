import Joi from "joi";

export const createDepartmentSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  createdBy: Joi.string().required(),
});
export const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(3).max(30).optional(),
  createdBy: Joi.string().optional(),
});