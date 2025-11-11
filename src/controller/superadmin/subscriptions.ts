import { Request, Response } from 'express';
import { SubscriptionModel } from '../../models/schema/subscriptions';
import { BadRequest } from '../../Errors/BadRequest';
import { NotFound } from '../../Errors/NotFound';
import { SuccessResponse } from '../../utils/response';

// ✅ Get all subscriptions
export const getAllSubscription = async (req: Request, res: Response) => {
  const data = await SubscriptionModel.find()
    .populate({ path: 'userId', select: '-password' })  // استبعاد الباسورد
    .populate('planId')
    .populate('PaymentId')
    .lean(); 


  SuccessResponse(res, { message: 'All subscription fetched successfully', data });
};

// ✅ Get single subscription by ID
export const getSubscriptionById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) throw new BadRequest('Please provide subscription id');

  const data = await SubscriptionModel.findById(id)
    .populate({ path: 'userId', select: '-password' })  
    .populate('planId')
    .populate('PaymentId')
    .lean();

  if (!data) throw new NotFound('Subscription not found');

  SuccessResponse(res, { message: 'Subscription fetched successfully', data });
};
