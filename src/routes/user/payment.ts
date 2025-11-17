import { Router } from "express";
import { createPayment,getAllPayments,getPaymentById,selectforpayment} from "../../controller/user/payment";
import { catchAsync } from "../../utils/catchAsync";

const route = Router();
route.post("/", catchAsync(createPayment));
route.get("/", catchAsync(getAllPayments));
route.get("/select", catchAsync(selectforpayment));
route.get("/:id", catchAsync(getPaymentById));
export default route;