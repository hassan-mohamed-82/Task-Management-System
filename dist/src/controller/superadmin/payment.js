"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePayment = exports.getPaymentByIdAdmin = exports.getAllPaymentsAdmin = void 0;
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const subscriptions_1 = require("../../models/schema/subscriptions");
const payment_1 = require("../../models/schema/payment");
const User_1 = require("../../models/schema/auth/User");
const Coupon_1 = require("../../models/schema/Coupon");
const getAllPaymentsAdmin = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const payments = await payment_1.PaymentModel.find()
        .populate("userId", "name email") // هات اسم و ايميل اليوزر بس
        .populate("plan_id") // هات تفاصيل البلان
        .populate("paymentmethod_id"); // هات تفاصيل الميثود
    const pending = payments.filter(p => p.status === "pending");
    const history = payments.filter(p => ["approved", "rejected"].includes(p.status));
    (0, response_1.SuccessResponse)(res, {
        message: "All payments fetched successfully (admin)",
        payments: {
            pending,
            history,
        },
    });
};
exports.getAllPaymentsAdmin = getAllPaymentsAdmin;
const getPaymentByIdAdmin = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide payment id");
    const payment = await payment_1.PaymentModel.findById(id)
        .populate("userId", "name email")
        .populate("plan_id")
        .populate("paymentmethod_id");
    if (!payment)
        throw new NotFound_1.NotFound("Payment not found");
    (0, response_1.SuccessResponse)(res, { message: "Payment fetched successfully (admin)", payment });
};
exports.getPaymentByIdAdmin = getPaymentByIdAdmin;
const updatePayment = async (req, res) => {
    const { id } = req.params;
    const { status, rejected_reason } = req.body;
    // ✅ تحقق من الحالة
    if (!["approved", "rejected"].includes(status)) {
        throw new BadRequest_1.BadRequest("Status must be either approved or rejected");
    }
    // ✅ جلب الدفع
    const payment = await payment_1.PaymentModel.findById(id).populate("plan_id");
    if (!payment)
        throw new NotFound_1.NotFound("Payment not found");
    // ✅ تحديث الحالة
    payment.status = status;
    // 🟥 لو مرفوض
    if (status === "rejected") {
        payment.rejected_reason = rejected_reason || "No reason provided";
        await payment.save();
        return (0, response_1.SuccessResponse)(res, { message: "Payment rejected", payment });
    }
    // 🟩 لو Approved
    const plan = payment.plan_id;
    const user = await User_1.User.findById(payment.userId);
    if (!user)
        throw new NotFound_1.NotFound("User not found");
    // ✅ التحقق من كود الخصم (Coupon)
    let finalPrice = payment.amount; // افتراضي
    if (payment.code) {
        const coupon = await Coupon_1.CouponModel.findOne({
            code: payment.code,
            isActive: true,
            start_date: { $lte: new Date() },
            end_date: { $gte: new Date() },
        });
        if (coupon) {
            // حساب الخصم
            if (coupon.discount_type === "percentage") {
                const discountAmount = (payment.amount * coupon.discount_value) / 100;
                finalPrice = payment.amount - discountAmount;
            }
            else if (coupon.discount_type === "amount") {
                finalPrice = payment.amount - coupon.discount_value;
            }
            // تأكد إن السعر النهائي مش أقل من صفر
            if (finalPrice < 0)
                finalPrice = 0;
        }
    }
    // ✅ احفظ السعر النهائي (مع التأكد من وجود الحقل في الـ Schema)
    payment.final_price = finalPrice;
    // ✅ حساب مدة الاشتراك
    let monthsToAdd = 0;
    const subscriptionType = payment.subscriptionType || "quarterly"; // افتراضي quarterly
    switch (subscriptionType) {
        case "monthly":
            monthsToAdd = 1;
            break;
        case "annually":
            monthsToAdd = 12;
            break;
        default:
            throw new BadRequest_1.BadRequest("Invalid subscription type");
    }
    // ✅ التعامل مع الاشتراك
    const userPlanId = user.planId;
    if (!userPlanId) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(startDate.getMonth() + monthsToAdd);
        await subscriptions_1.SubscriptionModel.create({
            userId: user._id,
            planId: plan._id,
            PaymentId: payment._id,
            startDate,
            endDate,
            status: "active",
            websites_created_count: 0,
            websites_remaining_count: plan.website_limit || 0,
        });
        user.planId = plan._id;
        await user.save();
    }
    else if (userPlanId.toString() === plan._id.toString()) {
        const subscription = await subscriptions_1.SubscriptionModel.findOne({
            userId: user._id,
            planId: plan._id,
            status: "active",
        }).sort({ createdAt: -1 });
        if (!subscription)
            throw new NotFound_1.NotFound("Active subscription not found");
        subscription.endDate.setMonth(subscription.endDate.getMonth() + monthsToAdd);
        await subscription.save();
    }
    else {
        await subscriptions_1.SubscriptionModel.updateMany({ userId: user._id, status: "active" }, { $set: { status: "expired" } });
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(startDate.getMonth() + monthsToAdd);
        await subscriptions_1.SubscriptionModel.create({
            userId: user._id,
            planId: plan._id,
            PaymentId: payment._id,
            startDate,
            endDate,
            status: "active",
            websites_created_count: 0,
            websites_remaining_count: plan.website_limit || 0,
        });
        user.planId = plan._id;
        await user.save();
    }
    await payment.save();
    (0, response_1.SuccessResponse)(res, { message: "Payment approved successfully", payment });
};
exports.updatePayment = updatePayment;
