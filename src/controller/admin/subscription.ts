import { Request, Response } from 'express';
import { SubscriptionModel } from '../../models/schema/subscriptions';
import { BadRequest } from '../../Errors/BadRequest';
import { NotFound } from '../../Errors/NotFound';
import { UnauthorizedError } from '../../Errors/unauthorizedError';
import { SuccessResponse } from '../../utils/response';

export const getSubscription = async (req: Request, res: Response) => {
  const user = req.user; 

  if (!user) throw new UnauthorizedError('Unauthorized');

  const data = await SubscriptionModel.find({ userId: user._id })
    .populate({ path: 'userId', select: '-password' })
    .populate('planId')
    .populate('PaymentId')
    .lean();


  SuccessResponse(res, { message: 'Your subscriptions fetched successfully', data });
};

export const getSubscriptionId = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new UnauthorizedError('Unauthorized');

  const { id } = req.params;
  if (!id) throw new BadRequest('Please provide subscription id');

  const data = await SubscriptionModel.findOne({ _id: id, userId: user._id }) 
    .populate({ path: 'userId', select: '-password' })
    .populate('planId')
    .populate('PaymentId')
    .lean();

  if (!data) throw new NotFound('Subscription not found for this user');

  SuccessResponse(res, { message: 'Subscription fetched successfully', data });
};
