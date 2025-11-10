"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionById = exports.getAllSubscription = void 0;
const subscriptions_1 = require("../../models/schema/subscriptions");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const response_1 = require("../../utils/response");
const getAllSubscription = async (req, res) => {
    const data = await subscriptions_1.SubscriptionModel.find().populate('userId').populate('planId').populate('PaymentId');
    if (!data)
        throw new NotFound_1.NotFound('No subscription found');
    (0, response_1.SuccessResponse)(res, { message: 'All subscription fetched successfully', data });
};
exports.getAllSubscription = getAllSubscription;
const getSubscriptionById = async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest('Please provide subscription id');
    const data = await subscriptions_1.SubscriptionModel.findById(id).populate('userId').populate('planId').populate('PaymentId');
    if (!data)
        throw new NotFound_1.NotFound('Subscription not found');
    (0, response_1.SuccessResponse)(res, { message: 'Subscription fetched successfully', data });
};
exports.getSubscriptionById = getSubscriptionById;
