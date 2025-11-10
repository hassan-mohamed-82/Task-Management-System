"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePaymentMethodById = exports.deletePaymentMethodById = exports.getPaymentMethodById = exports.getAllPaymentMethods = exports.createPaymentMethod = void 0;
const payment_methods_1 = require("../../models/schema/payment_methods");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const response_1 = require("../../utils/response");
const createPaymentMethod = async (req, res) => {
    const { name, isActive, discription, logo_Url } = req.body;
    if (!name || !discription || !logo_Url) {
        throw new BadRequest_1.BadRequest("Name, discription and logo_Url are required");
    }
    const existingPaymentMethod = await payment_methods_1.PaymentMethodModel.findOne({ name });
    if (existingPaymentMethod) {
        throw new BadRequest_1.BadRequest("Payment method with this name already exists");
    }
    const newPaymentMethod = new payment_methods_1.PaymentMethodModel({
        name,
        isActive,
        discription,
        logo_Url
    });
    await newPaymentMethod.save();
    return (0, response_1.SuccessResponse)(res, { message: "Payment method created successfully", paymentMethod: newPaymentMethod });
};
exports.createPaymentMethod = createPaymentMethod;
const getAllPaymentMethods = async (req, res) => {
    const paymentMethods = await payment_methods_1.PaymentMethodModel.find();
    return (0, response_1.SuccessResponse)(res, { message: "Payment methods fetched successfully", paymentMethods });
};
exports.getAllPaymentMethods = getAllPaymentMethods;
const getPaymentMethodById = async (req, res) => {
    const { id } = req.params;
    const paymentMethod = await payment_methods_1.PaymentMethodModel.findById(id);
    if (!paymentMethod) {
        throw new NotFound_1.NotFound("Payment method not found");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Payment method fetched successfully", paymentMethod });
};
exports.getPaymentMethodById = getPaymentMethodById;
const deletePaymentMethodById = async (req, res) => {
    const { id } = req.params;
    const paymentMethod = await payment_methods_1.PaymentMethodModel.findById(id);
    if (!paymentMethod) {
        throw new NotFound_1.NotFound("Payment method not found");
    }
    await payment_methods_1.PaymentMethodModel.findByIdAndDelete(id);
    return (0, response_1.SuccessResponse)(res, { message: "Payment method deleted successfully" });
};
exports.deletePaymentMethodById = deletePaymentMethodById;
const updatePaymentMethodById = async (req, res) => {
    const { id } = req.params;
    const { name, isActive, discription, logo_Url } = req.body;
    const paymentMethod = await payment_methods_1.PaymentMethodModel.findById(id);
    if (!paymentMethod) {
        throw new NotFound_1.NotFound("Payment method not found");
    }
    paymentMethod.name = name || paymentMethod.name;
    paymentMethod.isActive = isActive !== undefined ? isActive : paymentMethod.isActive;
    paymentMethod.discription = discription || paymentMethod.discription;
    paymentMethod.logo_Url = logo_Url || paymentMethod.logo_Url;
    await paymentMethod.save();
    return (0, response_1.SuccessResponse)(res, { message: "Payment method updated successfully" });
};
exports.updatePaymentMethodById = updatePaymentMethodById;
