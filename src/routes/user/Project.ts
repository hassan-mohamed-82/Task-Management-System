import { Router } from "express";
import { getallProject, getProjectDetailsForUser } from "../../controller/user/project";
import { catchAsync } from "../../utils/catchAsync";
import { authorizeRoles, checkProjectOrTaskRole } from "../../middlewares/authorized";

const route = Router();

route.get("/", catchAsync(getallProject));

route.get(
  "/:project_id",
  authorizeRoles("admin", "user"),
  checkProjectOrTaskRole(["teamlead", "member", "membercanapprove"]),
  catchAsync(getProjectDetailsForUser)
);

export default route;
