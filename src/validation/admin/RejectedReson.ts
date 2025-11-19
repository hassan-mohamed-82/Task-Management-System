import Joi from "joi";

export const createRejectedResonSchema = Joi.object({
  reason: Joi.string().required(),
  points: Joi.number().required(),
});

export const updateRejectedResonSchema = Joi.object({
  reason: Joi.string().optional(),
  points: Joi.number().optional(),
});