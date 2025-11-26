import Joi from "joi";

export const createUserProjectSchema = Joi.object({
    user_id: Joi.string().optional(),
    email: Joi.string().email().optional(),
    project_id: Joi.string().required(),
    role: Joi.string().valid('teamlead', 'member', 'membercanapprove','admin'),
});
export const updateUserProjectSchema = Joi.object({
    role: Joi.string().valid('teamlead', 'member', 'membercanapprove','admin'),
    project_id: Joi.string().required(),
    user_id: Joi.string().optional(),
    email: Joi.string().email().optional(),
});