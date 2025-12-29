import { Router } from "express";
import { getAllUsersInProject, updateUserRole, addUserToProject, deleteUserFromProject } from "../../controller/admin/User_Project";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createUserProjectSchema, updateUserProjectSchema } from "../../validation/admin/User_Project";
import { authorizeRoles, checkProjectOrTaskRole } from "../../middlewares/authorized";

const route = Router();

// استدعاء middleware لكل route على حدة
route.get(
  "/:project_id",
  authorizeRoles("admin", "user"),
  checkProjectOrTaskRole(["teamlead"]),
  catchAsync(getAllUsersInProject)
);

route.put(
  "/:user_id/:project_id",
  authorizeRoles("admin", "user"),
  checkProjectOrTaskRole(["teamlead"]),
  validate(updateUserProjectSchema),
  catchAsync(updateUserRole)
);

route.post(
  "/",
  authorizeRoles("admin", "user"),
  checkProjectOrTaskRole(["teamlead"]),
  validate(createUserProjectSchema),
  catchAsync(addUserToProject)
);

route.delete(
  "/:user_id/:project_id",
  authorizeRoles("admin", "user"),
  checkProjectOrTaskRole(["teamlead"]),
  catchAsync(deleteUserFromProject)
);

export default route;
