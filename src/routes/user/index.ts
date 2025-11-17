 import { Router } from "express";
import authRouter from "../user/auth/index";
import paymentRouter  from "./payment";
import paymentMethodRouter from "./payment_method";
import ProjectRouter from './Project'
import plansRouter from "./plans";
import TaskeRouter from "./Taske";
import { authenticated } from "../../middlewares/authenticated";
import { authorizeRoles } from "../../middlewares/authorized";
import { authorizeRoleAtProject } from "../../middlewares/authorized";
 const route = Router();
route.use("/auth", authRouter);
route.use(authenticated, authorizeRoles('user','admin'));
route.use("/payment-methods", paymentMethodRouter);
route.use("/payments", paymentRouter);
route.use("/plans", plansRouter);
route.use("/projects",
    // authorizeRoleAtProject(['member','viewer']), 
    ProjectRouter);
route.use("/tasks", 
   // authorizeRoleAtProject(['member'])
    TaskeRouter);
 export default route;