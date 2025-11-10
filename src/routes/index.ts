import { Router } from "express";
import userRouter from './user/index';
import adminRouter from './admin/index';
import superadminRouter from './superadmin/index';
const route = Router();
route.use('/superadmin', superadminRouter);

route.use('/admin', adminRouter);

route.use('/user', userRouter);

export default route;