"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionId = exports.getSubscription = void 0;
const subscriptions_1 = require("../../models/schema/subscriptions");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const getSubscription = async (req, res) => {
    const user = req.user;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError('Unauthorized');
    const data = await subscriptions_1.SubscriptionModel.find({ userId: user._id })
        .populate({ path: 'userId', select: '-password' })
        .populate('planId')
        .populate('PaymentId')
        .lean();
    (0, response_1.SuccessResponse)(res, { message: 'Your subscriptions fetched successfully', data });
};
exports.getSubscription = getSubscription;
const getSubscriptionId = async (req, res) => {
    const user = req.user;
    if (!user)
        throw new unauthorizedError_1.UnauthorizedError('Unauthorized');
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest('Please provide subscription id');
    const data = await subscriptions_1.SubscriptionModel.findOne({ _id: id, userId: user._id })
        .populate({ path: 'userId', select: '-password' })
        .populate('planId')
        .populate('PaymentId')
        .lean();
    if (!data)
        throw new NotFound_1.NotFound('Subscription not found for this user');
    (0, response_1.SuccessResponse)(res, { message: 'Subscription fetched successfully', data });
};
exports.getSubscriptionId = getSubscriptionId;
