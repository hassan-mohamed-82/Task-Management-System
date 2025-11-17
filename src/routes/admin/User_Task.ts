import { Router } from "express";
import {
  addUserTask,
  getalluserattask,
  removeUserFromTask,
  updateTaskStatus
} from "../../controller/admin/User_Task";
import { catchAsync } from "../../utils/catchAsync";
import { authenticated } from "../../middlewares/authenticated";
import { authorizeRoleAtProject } from "../../middlewares/authorized";

const route = Router();

// إضافة يوزر للتاسك → فقط Admin/Administrator
route.post(
  "/",
  catchAsync(addUserTask)
);

// جلب كل اليوزرز في التاسك
route.get(
  "/:taskId",
  catchAsync(getalluserattask)
);

// حذف يوزر من التاسك → فقط Admin/Administrator
route.delete(
  "/:taskId/:user_id",
  catchAsync(removeUserFromTask)
);

// تحديث حالة التاسك → فقط Admin/Administrator، و Task يجب أن تكون done
route.put(
  "/:taskId/:userId",
  catchAsync(updateTaskStatus)
);

export default route;
