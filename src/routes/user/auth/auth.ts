import { Router } from 'express';
import { signup, verifyEmail, login,resetPassword,verifyResetCode,sendResetCode} from '../../../controller/user/auth';
import { validate } from '../../../middlewares/validation';
import { authenticated } from '../../../middlewares/authenticated';
import { catchAsync } from '../../../utils/catchAsync';
import { checkResetCodeSchema, loginSchema, resetPasswordSchema, sendResetCodeSchema, signupSchema, verifyEmailSchema } from '../../../validation/user/auth';

const route = Router();

route.post("/signup", validate(signupSchema), catchAsync(signup));
route.post("/login", validate(loginSchema), catchAsync(login));
route.post(
  "/verify-email",
  validate(verifyEmailSchema),
  catchAsync(verifyEmail)
);
route.post("/forgot-password", validate(sendResetCodeSchema), sendResetCode);
route.post("/verify-code", validate(checkResetCodeSchema), catchAsync(verifyResetCode));
route.post("/reset-password", validate(resetPasswordSchema), resetPassword);


export default route;
