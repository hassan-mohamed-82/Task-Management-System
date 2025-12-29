import { Router } from "express";
import {addRejectedReson,getRejectedResons,getRejectedResonById,updateRejectedReson,deleteRejectedResonById} from "../../controller/admin/RejectedReson"
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createRejectedResonSchema, updateRejectedResonSchema } from "../../validation/admin/RejectedReson";

const route = Router();
route.post("/",validate(createRejectedResonSchema) ,catchAsync(addRejectedReson));
route.get("/", catchAsync(getRejectedResons));
route.get("/:id", catchAsync(getRejectedResonById));
route.put("/:id", validate(updateRejectedResonSchema) ,catchAsync(updateRejectedReson));
route.delete("/:id", catchAsync(deleteRejectedResonById));
export default route;