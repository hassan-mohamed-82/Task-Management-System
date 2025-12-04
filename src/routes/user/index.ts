import { Router } from "express";
import authRouter from "../user/auth/index";
import paymentRouter  from "./payment";
import paymentMethodRouter from "./payment_method";
import ProjectRouter from './Project'
import plansRouter from "./plans";
 import TaskeRouter from "./Taske";
 import profileRouter from "./profile";
import userRejectionRouter from "./User_Rejection";
import { authenticated } from "../../middlewares/authenticated";
import { authorizeRoles } from "../../middlewares/authorized";
import { checkProjectOrTaskRole } from "../../middlewares/authorized";
const route = Router();
route.use("/auth", authRouter);
route.use("/plans", plansRouter);
route.use("/payment-methods", paymentMethodRouter);
route.use(authenticated, authorizeRoles('user','admin'));
route.use("/payments", paymentRouter);
route.use("/profile", profileRouter);
route.use("/user-rejections", userRejectionRouter);
route.use("/projects",
    ProjectRouter);
route.use("/tasks", 
 TaskeRouter);
 export default route;