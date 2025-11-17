import { Router } from "express";
import {getUsersByProject,updateUserRole,addUserToProject,deleteUserFromProject,} from "../../controller/admin/User_Project"
import { catchAsync } from "../../utils/catchAsync";
const route = Router();

route.get("/:project_id", catchAsync(getUsersByProject));
route.put("/:userId/:project_id",catchAsync(updateUserRole));
route.post("/", catchAsync(addUserToProject));
route.delete("/:userId/:project_id", catchAsync(deleteUserFromProject));



export default route;