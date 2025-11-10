import { Router } from "express";
import { createUser,getAllUsers,getUserById,deleteUserById,updateUserById } from "../../controller/superadmin/Admin";
import { catchAsync } from "../../utils/catchAsync";
import { createAdminSchema,updateAdminSchema } from "../../validation/superadmin/Admin";
import { validate } from "../../middlewares/validation";

export const adminRouter = Router();
adminRouter.post("/",validate(createAdminSchema) ,catchAsync(createUser));
adminRouter.get("/", catchAsync(getAllUsers));
adminRouter.get("/:id", catchAsync(getUserById));
adminRouter.put("/:id", validate(updateAdminSchema) ,catchAsync(updateUserById));
adminRouter.delete("/:id", catchAsync(deleteUserById));
export default adminRouter;