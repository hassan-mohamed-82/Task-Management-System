import { PaymentMethodModel } from "../../models/schema/payment_methods";
import { Request, Response } from "express";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { SuccessResponse } from "../../utils/response";
export const createPaymentMethod = async (req: Request, res: Response) => {
    const { name, isActive, discription, logo_Url } = req.body;
    if (!name || !discription || !logo_Url) {
        throw new BadRequest("Name, discription and logo_Url are required");
    }
    const existingPaymentMethod = await PaymentMethodModel.findOne({ name });
    if (existingPaymentMethod) {
        throw new BadRequest("Payment method with this name already exists");
    }
    const newPaymentMethod = new PaymentMethodModel({
        name,
        isActive,
        discription,
        logo_Url
    });
    await newPaymentMethod.save();
    return SuccessResponse(res, { message: "Payment method created successfully" , paymentMethod: newPaymentMethod });
}

export const getAllPaymentMethods = async (req: Request, res: Response) => {
    const paymentMethods = await PaymentMethodModel.find();
    return SuccessResponse(res, {message: "Payment methods fetched successfully" ,paymentMethods });
}

export const getPaymentMethodById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const paymentMethod = await PaymentMethodModel.findById(id);
    if (!paymentMethod) {
        throw new NotFound("Payment method not found");
    }
    return SuccessResponse(res, {message: "Payment method fetched successfully" , paymentMethod });
}

export const deletePaymentMethodById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const paymentMethod = await PaymentMethodModel.findById(id);
    if (!paymentMethod) {
        throw new NotFound("Payment method not found");
    }
    await PaymentMethodModel.findByIdAndDelete(id);
    return SuccessResponse(res, { message: "Payment method deleted successfully" });
}
export const updatePaymentMethodById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, isActive, discription, logo_Url } = req.body;
    const paymentMethod = await PaymentMethodModel.findById(id);
    if (!paymentMethod) {
        throw new NotFound("Payment method not found");
    }
    paymentMethod.name = name || paymentMethod.name;
    paymentMethod.isActive = isActive !== undefined ? isActive : paymentMethod.isActive;
    paymentMethod.discription = discription || paymentMethod.discription;
    paymentMethod.logo_Url = logo_Url || paymentMethod.logo_Url;
    await paymentMethod.save();
    return SuccessResponse(res, { message: "Payment method updated successfully" });
}