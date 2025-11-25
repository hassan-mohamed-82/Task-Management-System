import { Router } from "express";
import {updateUserTaskStatus,getalltaskatprojectforuser} from "../../controller/user/taske"
import { catchAsync } from "../../utils/catchAsync";
import { authorizeRoles } from "../../middlewares/authorized";
import { checkProjectOrTaskRole } from "../../middlewares/authorized";
const route = Router();
route.put("/:taskId", 
    authorizeRoles("admin", "user"),
    checkProjectOrTaskRole(["teamlead", "Member", "Membercanapprove", "admin"]),
    catchAsync(updateUserTaskStatus));
route.get("/:project_id" ,
    authorizeRoles("admin", "user"),
    checkProjectOrTaskRole(["teamlead", "Member", "Membercanapprove", "admin"]), 
    catchAsync(getalltaskatprojectforuser));

export default route;