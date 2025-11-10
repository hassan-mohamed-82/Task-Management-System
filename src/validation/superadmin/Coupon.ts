import Joi from "joi";

export const createCouponSchema = Joi.object({
    code: Joi.string().alphanum().min(3).max(20).required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().required(),
    discount_type: Joi.string().valid('percentage', 'amount').optional(),
    discount_value: Joi.number().required(),
    isActive: Joi.boolean().optional(),
});
export const updateCouponSchema = Joi.object({
    code: Joi.string().alphanum().min(3).max(20).optional(),
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    discount_type: Joi.string().valid('percentage', 'amount').optional(),
    discount_value: Joi.number().optional(),
    isActive: Joi.boolean().optional(),
});
