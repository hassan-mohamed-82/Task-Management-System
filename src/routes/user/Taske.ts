import { Router } from "express";
import {updateUserTaskStatus,getalltaskatprojectforuser,getUserTaskByTaskId,reviewUserTaskByApprover,selection} from "../../controller/user/taske"
import { catchAsync } from "../../utils/catchAsync";
import { checkProjectOrTaskRole } from "../../middlewares/authorized";
const route = Router();
route.put("/:taskId", 
    catchAsync(updateUserTaskStatus));
route.get("/:taskId" ,
    catchAsync(getalltaskatprojectforuser));
route.get("/task/:taskId", 
    catchAsync(getUserTaskByTaskId));
route.put("/review/:taskId", 
    catchAsync(reviewUserTaskByApprover));
route.get("/selection",
    catchAsync(selection));

export default route;