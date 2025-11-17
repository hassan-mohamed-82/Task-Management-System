import { Router } from "express";
import authRouter from "./auth";
import projectRouter from "./project";
import SubscriptionRouter from "./subscription";
import TaskeRouter from "./Task";
import DepartmentRouter from "./Department";
import UserProjectRouter from "./User_Project";
import usertaskRouter from "./User_Task";
import { authenticated } from "../../middlewares/authenticated";
import { authorizeRoles } from "../../middlewares/authorized";
import { authorizeRoleAtProject } from "../../middlewares/authorized";

const route = Router();

route.use("/auth", authRouter);

route.use(authenticated, authorizeRoles('admin'));

route.use("/project", projectRouter);
route.use("/subscriptions", SubscriptionRouter);
route.use("/departments", DepartmentRouter);

route.use(
    "/tasks",
    TaskeRouter
);
route.use(
  "/user-project",
  UserProjectRouter
);

route.use(
  "/user-task",
  
  usertaskRouter
);

export default route;
