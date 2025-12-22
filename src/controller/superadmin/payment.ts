import { Request, Response } from 'express';
import { PaymentMethodModel } from '../../models/schema/payment_methods';
import { BadRequest } from '../../Errors/BadRequest';
import { NotFound } from '../../Errors/NotFound';
import { UnauthorizedError } from '../../Errors/unauthorizedError';
import { SuccessResponse } from '../../utils/response';
import { SubscriptionModel } from '../../models/schema/subscriptions';
import { PaymentModel } from '../../models/schema/payment';
import { User } from '../../models/schema/auth/User';
import { CouponModel } from '../../models/schema/Coupon';

export const getAllPaymentsAdmin = async (req: Request, res: Response) => {

  const payments = await PaymentModel.find()
    .populate("userId", "name email") // هات اسم و ايميل اليوزر بس
    .populate("plan_id") // هات تفاصيل البلان
    .populate("paymentmethod_id"); // هات تفاصيل الميثود

  const pending = payments.filter(p => p.status === "pending");
  const history = payments.filter(p => ["approved", "rejected"].includes(p.status));

  SuccessResponse(res, {
    message: "All payments fetched successfully (admin)",
    payments: {
      pending,
      history,
    },
  });
};

export const getPaymentByIdAdmin = async (req: Request, res: Response) => {

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide payment id");

  const payment = await PaymentModel.findById(id)
    .populate("userId", "name email")
    .populate("plan_id")
    .populate("paymentmethod_id");

  if (!payment) throw new NotFound("Payment not found");

  SuccessResponse(res, { message: "Payment fetched successfully (admin)", payment });
};



export const updatePayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, rejected_reason } = req.body;

  // ✅ تحقق من الحالة
  if (!["approved", "rejected"].includes(status)) {
    throw new BadRequest("Status must be either approved or rejected");
  }

  // ✅ جلب الدفع
  const payment = await PaymentModel.findById(id).populate("plan_id");
  if (!payment) throw new NotFound("Payment not found");

  // 🟥 لو مرفوض
  if (status === "rejected") {
    payment.status = "rejected";
    payment.rejected_reason = rejected_reason || "No reason provided";
    await payment.save();
    return SuccessResponse(res, { message: "Payment rejected", payment });
  }

  // 🟩 لو Approved
  const plan: any = payment.plan_id;
  const user = await User.findById(payment.userId);
  if (!user) throw new NotFound("User not found");

  // ✅ تحويل role للـ user إلى admin
  user.role = "admin";
  await user.save();

  // ✅ التحقق من كود الخصم (Coupon)
  let finalPrice = payment.amount; // افتراضي
  if (payment.code) {
    const coupon = await CouponModel.findOne({
      code: payment.code,
      isActive: true,
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() },
    });

    if (coupon) {
      if (coupon.discount_type === "percentage") {
        const discountAmount = (payment.amount * coupon.discount_value) / 100;
        finalPrice = payment.amount - discountAmount;
      } else if (coupon.discount_type === "amount") {
        finalPrice = payment.amount - coupon.discount_value;
      }
      if (finalPrice < 0) finalPrice = 0;
    }
  }

  (payment as any).final_price = finalPrice;

  // ✅ حساب مدة الاشتراك
  let monthsToAdd = 0;
  const subscriptionType = payment.subscriptionType || "monthly";
  switch (subscriptionType) {
    case "monthly":
      monthsToAdd = 1;
      break;
    case "annually":
      monthsToAdd = 12;
      break;
    default:
      throw new BadRequest("Invalid subscription type");
  }

  // ✅ التعامل مع الاشتراك
  const userPlanId = (user as any).planId;

  if (!userPlanId) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + monthsToAdd);

    await SubscriptionModel.create({
      userId: user._id,
      planId: plan._id,
      PaymentId: payment._id,
      startDate,
      endDate,
      status: "active",
      websites_created_count: 0,
      websites_remaining_count: plan.website_limit || 0,
    });

    (user as any).planId = plan._id;
    await user.save();
  } else if (userPlanId.toString() === plan._id.toString()) {
    const subscription = await SubscriptionModel.findOne({
      userId: user._id,
      planId: plan._id
    }).sort({ createdAt: -1 });

    if (!subscription) throw new NotFound("Active subscription not found");
    if (subscription.status === "expired") {
      subscription.status = "active";
    }
    subscription.endDate.setMonth(subscription.endDate.getMonth() + monthsToAdd);

    await subscription.save();
  } else {
    await SubscriptionModel.updateMany(
      { userId: user._id, status: "active" },
      { $set: { status: "expired" } }
    );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + monthsToAdd);

    await SubscriptionModel.create({
      userId: user._id,
      planId: plan._id,
      PaymentId: payment._id,
      startDate,
      endDate,
      status: "active",
      websites_created_count: 0,
      websites_remaining_count: plan.website_limit || 0,
    });

    (user as any).planId = plan._id;
    await user.save();
  }

  payment.status = "approved";
  await payment.save();

  SuccessResponse(res, { message: "Payment approved successfully and user is now admin", payment });
};