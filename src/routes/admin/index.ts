import { Router } from "express";
import authRouter from "./auth";
import projectRouter from "./project";
import SubscriptionRouter from "./subscription";
import TaskeRouter from "./Task";
import DepartmentRouter from "./Department";
import RejectedResonRouter from "./RejectdReson";
import profileRouter from "./profile";
 import UserProjectRouter from "./User_Project";
import usertaskRouter from "./User_Task";
import { authenticated } from "../../middlewares/authenticated";
import { authorizeRoles } from "../../middlewares/authorized";
import { checkProjectOrTaskRole } from "../../middlewares/authorized";

const route = Router();

route.use("/auth", authRouter);

route.use(authenticated);




// /tasks route
route.use(
  "/tasks",
  TaskeRouter
);

// /user-project route
route.use(
  "/user-project",    
  UserProjectRouter
);

route.use(
  "/user-task",
  authorizeRoles('admin', 'user'),
  checkProjectOrTaskRole(['teamlead','admin']),  
  usertaskRouter
);

 authorizeRoles('admin')
route.use("/profile", profileRouter);
route.use("/project", projectRouter);
route.use("/subscriptions", SubscriptionRouter);
route.use("/departments", DepartmentRouter);
route.use("/rejected-reasons", RejectedResonRouter);

export default route;
