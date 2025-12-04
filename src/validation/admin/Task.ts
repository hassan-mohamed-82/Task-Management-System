import Joi from "joi";

export const createTaskSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    projectId: Joi.string().required(),
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    status: Joi.string().valid('Pending', 'in_progress', 'done','Approved' ,'rejected').default('Pending'),
    Depatment_id: Joi.string().optional(),
    userId: Joi.string().optional(),
    file: Joi.any().optional(),
recorde: Joi.any().optional(),
createdBy:Joi.string().optional()


});


export const updateTaskSchema = Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    projectId: Joi.string().optional(),
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    status: Joi.string().valid('Pending', 'in_progress', 'done','Approved' ,'rejected').optional(),
    Depatment_id:Joi.string().optional(),
    file: Joi.any().optional(),
recorde: Joi.any().optional(),
createdBy:Joi.string().optional()

    
});


