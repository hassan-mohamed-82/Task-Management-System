import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
      code: { type: String, required: true, unique: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    discount_type: { type:String, enum: ['percentage', 'amount'], default: 'percentage' },
    discount_value: { type: Number, required: true },
isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const CouponModel = mongoose.model('Coupon', CouponSchema);