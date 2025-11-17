"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectforpayment = exports.getPaymentById = exports.getAllPayments = exports.createPayment = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const plans_1 = require("../../models/schema/plans");
const payment_1 = require("../../models/schema/payment");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const Coupon_1 = require("../../models/schema/Coupon");
const CouponUser_1 = require("../../models/schema/CouponUser");
const handleImages_1 = require("../../utils/handleImages");
const payment_methods_1 = require("../../models/schema/payment_methods");
const createPayment = async (req, res) => {
    if (!req.user)
        throw new unauthorizedError_1.UnauthorizedError("User is not authenticated");
    const userId = req.user.id;
    const { plan_id, paymentmethod_id, amount, code, subscriptionType, photo } = req.body;
    // ✅ التحقق من كل الحقول المطلوبة
    if (!amount || !paymentmethod_id || !plan_id || !photo) {
        throw new BadRequest_1.BadRequest("Please provide all the required fields, including photo");
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(plan_id))
        throw new BadRequest_1.BadRequest("Invalid plan ID");
    if (!mongoose_1.default.Types.ObjectId.isValid(paymentmethod_id))
        throw new BadRequest_1.BadRequest("Invalid payment method ID");
    const plan = await plans_1.PlanModel.findById(plan_id);
    if (!plan)
        throw new NotFound_1.NotFound("Plan not found");
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new BadRequest_1.BadRequest("Amount must be a positive number");
    }
    const validAmounts = [plan.price_monthly, plan.price_annually].filter(p => p != null);
    if (!validAmounts.includes(parsedAmount)) {
        throw new BadRequest_1.BadRequest("Invalid payment amount for this plan");
    }
    // ===== حساب الخصم لو فيه كوبون =====
    let discountAmount = 0;
    if (code) {
        const today = new Date();
        const promo = await Coupon_1.CouponModel.findOne({
            code,
            isActive: true,
            start_date: { $lte: today },
            end_date: { $gte: today },
        });
        if (!promo)
            throw new BadRequest_1.BadRequest("Invalid or expired promo code");
        const alreadyUsed = await CouponUser_1.CouponUserModel.findOne({ userId, codeId: promo._id });
        if (alreadyUsed)
            throw new BadRequest_1.BadRequest("You have already used this promo code");
        if (!["monthly", "yearly"].includes(subscriptionType)) {
            throw new BadRequest_1.BadRequest("Invalid subscription type");
        }
        discountAmount = promo.discount_type === "percentage"
            ? (parsedAmount * promo.discount_value) / 100
            : promo.discount_value;
        await CouponUser_1.CouponUserModel.create({ userId, codeId: promo._id });
    }
    const finalAmount = parsedAmount - discountAmount;
    if (finalAmount <= 0)
        throw new BadRequest_1.BadRequest("Invalid payment amount after applying promo code");
    // ===== حفظ الصورة Base64 =====
    // TypeScript يعرف الآن أن photo موجود
    const photoUrl = await (0, handleImages_1.saveBase64Image)(photo, userId !== undefined ? userId : '', req, "payments");
    // ===== إنشاء الدفع =====
    const payment = await payment_1.PaymentModel.create({
        amount: finalAmount,
        paymentmethod_id,
        plan_id,
        payment_date: new Date(),
        userId: userId, // مؤكد موجود
        status: "pending",
        code,
        photo: photoUrl,
        subscriptionType,
    });
    (0, response_1.SuccessResponse)(res, {
        message: "Payment created successfully. Promo code applied (if valid).",
        payment,
        discountAmount,
    });
};
exports.createPayment = createPayment;
const getAllPayments = async (req, res) => {
    if (!req.user)
        throw new unauthorizedError_1.UnauthorizedError("user is not authenticated");
    const payments = await payment_1.PaymentModel.find({ userId: req.user.id })
        .populate("paymentmethod_id")
        .populate("plan_id");
    const pending = payments.filter(p => p.status === "pending");
    const history = payments.filter(p => ["approved", "rejected"].includes(p.status));
    (0, response_1.SuccessResponse)(res, {
        message: "All payments fetched successfully",
        payments: {
            pending,
            history,
        },
    });
};
exports.getAllPayments = getAllPayments;
const getPaymentById = async (req, res) => {
    if (!req.user)
        throw new unauthorizedError_1.UnauthorizedError("user is not authenticated");
    const userId = req.user.id;
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide payment id");
    const payment = await payment_1.PaymentModel.findOne({ _id: id, userId })
        .populate("paymentmethod_id")
        .populate("plan_id"); // ✅ جبت تفاصيل البلان برضه
    if (!payment)
        throw new NotFound_1.NotFound("Payment not found");
    (0, response_1.SuccessResponse)(res, { message: "Payment fetched successfully", payment });
};
exports.getPaymentById = getPaymentById;
const selectforpayment = async (req, res) => {
    const plan = await plans_1.PlanModel.find();
    const paymentmethod = await payment_methods_1.PaymentMethodModel.find();
    (0, response_1.SuccessResponse)(res, { message: "Payment fetched successfully", plan, paymentmethod });
};
exports.selectforpayment = selectforpayment;
