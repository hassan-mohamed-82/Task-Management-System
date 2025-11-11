import { Router } from "express";
import {getAllSubscription,getSubscriptionById} from "../../controller/superadmin/subscriptions";
import { catchAsync } from "../../utils/catchAsync";
const route = Router();
route.get("/", catchAsync(getAllSubscription));
route.get("/:id", catchAsync(getSubscriptionById));
export default route;
