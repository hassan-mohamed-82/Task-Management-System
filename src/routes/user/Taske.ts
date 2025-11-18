import { Router } from "express";
import { getUserTasksByProject, updateUserTaskStatus, requestTaskApproval,getMyTasks
    ,getalluserattask,updateTaskStatus,addUserTask,removeUserFromTask
} from "../../controller/user/taske";
import { authenticated } from "../../middlewares/authenticated";
import { catchAsync } from "../../utils/catchAsync";

const route = Router();

route.get("/", catchAsync(getMyTasks));
// جلب المهام الخاصة باليوزر لمشروع معين
route.get("/:project_id" , catchAsync(getUserTasksByProject));

// تعديل حالة مهمة خطوة خطوة
route.put("/:taskId", catchAsync(updateUserTaskStatus));

// طلب الموافقة على المهمة
route.put("/request/:taskId", catchAsync(requestTaskApproval));

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

// اضافة يوزر للتاسك → فقط Admin/Administrator
route.post(
  "/",
  catchAsync(addUserTask)
);

// تحديث حالة التاسك → فقط Admin/Administrator، و Task يجب أن تكون done
route.put("/:taskId/:userId", catchAsync(updateTaskStatus));

export default route;
