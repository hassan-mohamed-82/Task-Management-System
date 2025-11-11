import { Router } from "express";
import {getSubscription,getSubscriptionId } from "../../controller/admin/subscription";
import { catchAsync } from "../../utils/catchAsync";
const route = Router();
route.get("/", catchAsync(getSubscription));
route.get("/:id", catchAsync(getSubscriptionId));
export default route;
