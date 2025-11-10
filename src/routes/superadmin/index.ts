import { Router } from "express";
import authRouter from "./auth";
import plansRouter from "./plans";
import CouponRouter from "./Coupon";
import paymentMethodRouter from "./payment_method";
import adminRouter from "./Admin";
import { authenticated } from "../../middlewares/authenticated";
import {  authorizeRoles } from "../../middlewares/authorized";
export const route = Router();

route.use("/auth", authRouter);
route.use(authenticated, authorizeRoles('SuperAdmin'));
route.use("/plans", plansRouter);
route.use("/coupons", CouponRouter);
route.use("/payment-methods", paymentMethodRouter);
route.use("/admins", adminRouter);

export default route;