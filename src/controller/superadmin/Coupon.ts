import { SuccessResponse } from "../../utils/response";
import { Request, Response } from "express";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { CouponModel } from "../../models/schema/Coupon";
export const createCoupon = async (req: Request, res: Response) => {
    const { code, start_date, end_date, discount_type, discount_value, isActive } = req.body;   
    if (!code || !start_date || !end_date || !discount_value) {
        throw new BadRequest("Code, start_date, end_date and discount_value are required");
    }
    const existingCoupon = await CouponModel.findOne({ code });
    if (existingCoupon) {
        throw new BadRequest("Coupon with this code already exists");
    }
    const newCoupon = new CouponModel({
        code,
        start_date,
        end_date,
        discount_type,
        discount_value,
        isActive
    });
    await newCoupon.save();
    return SuccessResponse(res, { message: "Coupon created successfully" , coupon: newCoupon });
}

export const getAllCoupons = async (req: Request, res: Response) => {
    const coupons = await CouponModel.find();
    return SuccessResponse(res, { coupons });
}
export const getCouponById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const coupon = await CouponModel.findById(id);
    if (!coupon) {
        throw new NotFound("Coupon not found");
    }
    return SuccessResponse(res, {message: "Coupon fetched successfully" ,coupon });
}
export const deleteCouponById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const coupon = await CouponModel.findById(id);
    if (!coupon) {
        throw new NotFound("Coupon not found");
    }
    await CouponModel.findByIdAndDelete(id);
    return SuccessResponse(res, { message: "Coupon deleted successfully" });
}
export const updateCouponById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { code, start_date, end_date, discount_type, discount_value, isActive } = req.body;
    const coupon = await CouponModel.findById(id);
    if (!coupon) {
        throw new NotFound("Coupon not found");
    }
    coupon.code = code || coupon.code;
    coupon.start_date = start_date || coupon.start_date;
    coupon.end_date = end_date || coupon.end_date;
    coupon.discount_type = discount_type || coupon.discount_type;
    coupon.discount_value = discount_value || coupon.discount_value;
    coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;
    await coupon.save();
    return SuccessResponse(res, { message: "Coupon updated successfully" });
}
    