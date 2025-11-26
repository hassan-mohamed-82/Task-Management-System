import Joi from "joi"

export const createUserTaskSchema = Joi.object({
    user_id: Joi.string().required(),
    task_id: Joi.string().required(),
    role: Joi.string().valid( 'member', 'membercanapprove'),
    User_taskId: Joi.array().items(Joi.string()).optional()
});
