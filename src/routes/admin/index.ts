import { Router } from "express";
import authRouter from "./auth";
import projectRouter from "./project";
import SubscriptionRouter from "./subscription";
import { authenticated } from "../../middlewares/authenticated";
import {  authorizeRoles } from "../../middlewares/authorized";

export const route = Router();

route.use("/auth", authRouter);
route.use(authenticated, authorizeRoles('admin'));
route.use("/project", projectRouter);
route.use("/subscriptions", SubscriptionRouter);



export default route;