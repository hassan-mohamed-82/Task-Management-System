import { Router } from "express";
import {updateUserTaskStatus,getalltaskatprojectforuser,getusertaskattaskbyid} from "../../controller/user/taske"
import { catchAsync } from "../../utils/catchAsync";
import { checkProjectOrTaskRole } from "../../middlewares/authorized";
const route = Router();
route.put("/:taskId", 
    catchAsync(updateUserTaskStatus));
route.get("/:project_id" ,
    catchAsync(getalltaskatprojectforuser));
route.get("/task/:taskId", 
    checkProjectOrTaskRole(['member','membercanapprove', 'teamlead', 'admin']),
    catchAsync(getusertaskattaskbyid));

export default route;