import Joi from "joi";
export const createPlanSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  price_monthly: Joi.number().optional(),
price_annually :Joi.number().optional(),
projects_limit: Joi.number().required(),
members_limit:Joi.number().required(),

});

export const updatePlanSchema = Joi.object({
  name: Joi.string().min(3).max(30).optional(),
  price_monthly: Joi.number().optional(),
price_annually :Joi.number().optional(),
projects_limit: Joi.number().optional(),
members_limit:Joi.number().optional(),
});