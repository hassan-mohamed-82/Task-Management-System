import Joi from "joi";

export const CreatePaymentMethodSchema = Joi.object({
  name: Joi.string().required(),
  discription: Joi.string().required(),
  isActive: Joi.boolean().default(true),
  logo_Url: Joi.string().optional(),
 });

export const UpdatePaymentMethodSchema = Joi.object({
        name: Joi.string().optional(),
        discription: Joi.string().optional(),
        isActive: Joi.boolean().optional(),
        logo_Url: Joi.string().optional(),
    });