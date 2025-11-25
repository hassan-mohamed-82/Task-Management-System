import { Router } from "express";
import {updateUserTaskStatus,getalltaskatprojectforuser} from "../../controller/user/taske"
import { catchAsync } from "../../utils/catchAsync";
import { checkProjectOrTaskRole } from "../../middlewares/authorized";
const route = Router();
route.put("/:taskId", 
    checkProjectOrTaskRole(["teamlead", "Member", "Membercanapprove", "admin"]),
    catchAsync(updateUserTaskStatus));
route.get("/:project_id" ,
    checkProjectOrTaskRole(["teamlead", "Member", "Membercanapprove", "admin"]), 
    catchAsync(getalltaskatprojectforuser));

export default route;