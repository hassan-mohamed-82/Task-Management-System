import { Router } from "express";
import { getUserTasksByProject, updateUserTaskStatus, requestTaskApproval,getMyTasks} from "../../controller/user/taske";
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

export default route;
