"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCouponById = exports.deleteCouponById = exports.getCouponById = exports.getAllCoupons = exports.createCoupon = void 0;
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const Coupon_1 = require("../../models/schema/Coupon");
const createCoupon = async (req, res) => {
    const { code, start_date, end_date, discount_type, discount_value, isActive } = req.body;
    if (!code || !start_date || !end_date || !discount_value) {
        throw new BadRequest_1.BadRequest("Code, start_date, end_date and discount_value are required");
    }
    const existingCoupon = await Coupon_1.CouponModel.findOne({ code });
    if (existingCoupon) {
        throw new BadRequest_1.BadRequest("Coupon with this code already exists");
    }
    const newCoupon = new Coupon_1.CouponModel({
        code,
        start_date,
        end_date,
        discount_type,
        discount_value,
        isActive
    });
    await newCoupon.save();
    return (0, response_1.SuccessResponse)(res, { message: "Coupon created successfully", coupon: newCoupon });
};
exports.createCoupon = createCoupon;
const getAllCoupons = async (req, res) => {
    const coupons = await Coupon_1.CouponModel.find();
    return (0, response_1.SuccessResponse)(res, { coupons });
};
exports.getAllCoupons = getAllCoupons;
const getCouponById = async (req, res) => {
    const { id } = req.params;
    const coupon = await Coupon_1.CouponModel.findById(id);
    if (!coupon) {
        throw new NotFound_1.NotFound("Coupon not found");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Coupon fetched successfully", coupon });
};
exports.getCouponById = getCouponById;
const deleteCouponById = async (req, res) => {
    const { id } = req.params;
    const coupon = await Coupon_1.CouponModel.findById(id);
    if (!coupon) {
        throw new NotFound_1.NotFound("Coupon not found");
    }
    await Coupon_1.CouponModel.findByIdAndDelete(id);
    return (0, response_1.SuccessResponse)(res, { message: "Coupon deleted successfully" });
};
exports.deleteCouponById = deleteCouponById;
const updateCouponById = async (req, res) => {
    const { id } = req.params;
    const { code, start_date, end_date, discount_type, discount_value, isActive } = req.body;
    const coupon = await Coupon_1.CouponModel.findById(id);
    if (!coupon) {
        throw new NotFound_1.NotFound("Coupon not found");
    }
    coupon.code = code || coupon.code;
    coupon.start_date = start_date || coupon.start_date;
    coupon.end_date = end_date || coupon.end_date;
    coupon.discount_type = discount_type || coupon.discount_type;
    coupon.discount_value = discount_value || coupon.discount_value;
    coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;
    await coupon.save();
    return (0, response_1.SuccessResponse)(res, { message: "Coupon updated successfully" });
};
exports.updateCouponById = updateCouponById;
