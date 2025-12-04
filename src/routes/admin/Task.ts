import { Router } from "express";
import {createTask,getAllTasks,getTaskById,updateTask,deleteTask,approveOrRejectTask,toggleTaskStatus} from "../../controller/admin/Task"
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createTaskSchema, updateTaskSchema } from "../../validation/admin/Task";
import { uploadTaskFiles } from "../../utils/multer"; // ملف multer اللي عملته
import { authorizeRoles, checkProjectOrTaskRole } from "../../middlewares/authorized";



const route = Router();

route.get("/",authorizeRoles("admin", "user"),
checkProjectOrTaskRole(["teamlead", "admin"]),
catchAsync(getAllTasks));
route.get("/:id",authorizeRoles("admin", "user"),
checkProjectOrTaskRole(["teamlead", "admin"]),
 catchAsync(getTaskById));
route.post(
  "/",authorizeRoles("admin", "user"),
checkProjectOrTaskRole(["teamlead", "admin"]),
uploadTaskFiles,
  validate(createTaskSchema),        
  catchAsync(createTask)
);
route.post("/approve_reject/:id",authorizeRoles("admin", "user"),
checkProjectOrTaskRole(["teamlead", "admin"]),
 catchAsync(approveOrRejectTask));

route.post("/toggle_status/:id",authorizeRoles("admin", "user"),
checkProjectOrTaskRole(["teamlead", "admin"]),
 catchAsync(toggleTaskStatus));
route.put("/:id",authorizeRoles("admin", "user"),
checkProjectOrTaskRole(["teamlead", "admin"]),
 validate(updateTaskSchema), catchAsync(updateTask));
route.delete("/:id", authorizeRoles("admin", "user"),
checkProjectOrTaskRole(["teamlead", "admin"]),
catchAsync(deleteTask));

export default route;