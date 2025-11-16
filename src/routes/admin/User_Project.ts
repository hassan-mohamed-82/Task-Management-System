import { Router } from "express";
import {getUsersByProject,updateuserRole,addUserToProject,deleteUserFromProject,} from "../../controller/admin/User_Project"
import { catchAsync } from "../../utils/catchAsync";
const route = Router();

route.get("/", catchAsync(getUsersByProject));
route.put("/", catchAsync(updateuserRole));
route.post("/", catchAsync(addUserToProject));
route.delete("/", catchAsync(deleteUserFromProject));



export default route;