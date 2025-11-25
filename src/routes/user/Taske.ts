import { Router } from "express";
import {updateUserTaskStatus,getalltaskatprojectforuser} from "../../controller/user/taske"
import { catchAsync } from "../../utils/catchAsync";
import { checkProjectOrTaskRole } from "../../middlewares/authorized";
const route = Router();
route.put("/:taskId", 
    catchAsync(updateUserTaskStatus));
route.get("/:projectId" ,
    catchAsync(getalltaskatprojectforuser));

export default route;