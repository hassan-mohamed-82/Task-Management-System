import { Router } from "express";
import {addUserTask,getalluserattask,removeUserFromTask} from "../../controller/admin/User_Task"
import { catchAsync } from "../../utils/catchAsync";
const route = Router();

route.post("/", catchAsync(addUserTask));
route.get("/", catchAsync(getalluserattask));
route.delete("/", catchAsync(removeUserFromTask));


export default route;