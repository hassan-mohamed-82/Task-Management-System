import mongoose from "mongoose";
import { Request, Response } from "express";
import { PlanModel } from "../../models/schema/plans";
import { PaymentModel } from "../../models/schema/payment";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";
import { CouponModel } from "../../models/schema/Coupon";
import { CouponUserModel } from "../../models/schema/CouponUser";
import { saveBase64Image } from "../../utils/handleImages";
import { PaymentMethodModel } from "../../models/schema/payment_methods";

export const createPayment = async (req: Request, res: Response) => {
  // ✅ التأكد من وجود المستخدم ووجود _id
  if (!req.user?._id) throw new UnauthorizedError("User is not authenticated");
  const userId = req.user._id;

  const { plan_id, paymentmethod_id, amount, code, subscriptionType, photo } = req.body;

  // ✅ التحقق من الحقول المطلوبة
  if (!amount || !paymentmethod_id || !plan_id || !photo) {
    throw new BadRequest("Please provide all the required fields, including photo");
  }

  if (!mongoose.Types.ObjectId.isValid(plan_id)) throw new BadRequest("Invalid plan ID");
  if (!mongoose.Types.ObjectId.isValid(paymentmethod_id)) throw new BadRequest("Invalid payment method ID");

  const exist_payment_method = await PaymentMethodModel.findById(paymentmethod_id);
  if (!exist_payment_method) throw new NotFound("Payment method not found");

  const plan = await PlanModel.findById(plan_id);
  if (!plan) throw new NotFound("Plan not found");

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new BadRequest("Amount must be a positive number");
  }

  const validAmounts = [plan.price_monthly, plan.price_annually].filter(p => p != null);
  if (!validAmounts.includes(parsedAmount)) {
    throw new BadRequest("Invalid payment amount for this plan");
  }

  // ===== حساب الخصم لو فيه كوبون =====
  let discountAmount = 0;
  if (code) {
    const today = new Date();
    const promo = await CouponModel.findOne({
      code,
      isActive: true,
      start_date: { $lte: today },
      end_date: { $gte: today },
    });
    if (!promo) throw new BadRequest("Invalid or expired promo code");

    const alreadyUsed = await CouponUserModel.findOne({ userId, codeId: promo._id });
    if (alreadyUsed) throw new BadRequest("You have already used this promo code");

    if (!["monthly", "yearly"].includes(subscriptionType)) {
      throw new BadRequest("Invalid subscription type");
    }

    discountAmount = promo.discount_type === "percentage"
      ? (parsedAmount * promo.discount_value) / 100
      : promo.discount_value;

    await CouponUserModel.create({ userId, codeId: promo._id });
  }

  const finalAmount = parsedAmount - discountAmount;
  if (finalAmount <= 0) throw new BadRequest("Invalid payment amount after applying promo code");

  // ===== حفظ الصورة Base64 =====
  const photoUrl = await saveBase64Image(photo, userId.toString(), req, "payments");

  // ===== إنشاء الدفع =====
  const payment = await PaymentModel.create({
    amount: finalAmount,
    paymentmethod_id,
    plan_id,
    payment_date: new Date(),
    userId, // ✅ آمن الآن بدون تحذيرات
    status: "pending",
    code,
    photo: photoUrl,
    subscriptionType,
  });

  SuccessResponse(res, {
    message: "Payment created successfully. Promo code applied (if valid).",
    payment,
    discountAmount,
  });
};
export const getAllPayments = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("user is not authenticated");

  const payments = await PaymentModel.find({ userId: req.user.id })
    .populate("paymentmethod_id")
    .populate("plan_id");

  const pending = payments.filter(p => p.status === "pending");
  const history = payments.filter(p => ["approved", "rejected"].includes(p.status));

  SuccessResponse(res, {
    message: "All payments fetched successfully",
    payments: {
      pending,
      history,
    },
  });
};

export const getPaymentById = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("user is not authenticated");
  const userId = req.user.id;
  const { id } = req.params;

  if (!id) throw new BadRequest("Please provide payment id");

  const payment = await PaymentModel.findOne({ _id: id, userId })
    .populate("paymentmethod_id")
    .populate("plan_id"); // ✅ جبت تفاصيل البلان برضه

  if (!payment) throw new NotFound("Payment not found");

  SuccessResponse(res, { message: "Payment fetched successfully", payment });
};



export const selectforpayment = async (req: Request, res: Response) => {
  const plan = await PlanModel.find();
  const paymentmethod = await PaymentMethodModel.find();
  SuccessResponse(res, { message: "Payment fetched successfully", plan, paymentmethod });
}