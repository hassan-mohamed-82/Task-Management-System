import { Router } from "express";
import  {createPlan,deletePlanById,getAllPlans,getPlanById,updatePlanById} from "../../controller/superadmin/plans"
import { catchAsync } from "../../utils/catchAsync";
import { createPlanSchema, updatePlanSchema } from "../../validation/superadmin/plans";
import { validate } from "../../middlewares/validation";
export const plansRouter = Router();

plansRouter.post("/",validate(createPlanSchema) ,catchAsync(createPlan));
plansRouter.get("/", catchAsync(getAllPlans));
plansRouter.get("/:id", catchAsync(getPlanById));
plansRouter.put("/:id", validate(updatePlanSchema) ,catchAsync(updatePlanById));
plansRouter.delete("/:id", catchAsync(deletePlanById));

export default plansRouter;