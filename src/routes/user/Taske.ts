import { Router } from "express";
import {
  updateUserTaskStatus,
  getalltaskatprojectforuser,
  getTaskDetailsForUser,
  reviewUserTaskByApprover,
  selection,
} from "../../controller/user/taske";
import { catchAsync } from "../../utils/catchAsync";
import { checkProjectOrTaskRole } from "../../middlewares/authorized";

const route = Router();

// 1) routes الثابتة الأول
route.get("/selection",
  catchAsync(selection)
);

// 2) routes الخاصة بالمراجعة / تفاصيل التاسك
route.put("/review/:taskId",
  catchAsync(reviewUserTaskByApprover)
);

route.get("/task/:taskId",
  catchAsync(getTaskDetailsForUser)
);

// 3) في الآخر الـ routes الديناميكية العامة
route.put("/:taskId",
  catchAsync(updateUserTaskStatus)
);

route.get("/:taskId",
  catchAsync(getalltaskatprojectforuser)
);

export default route;
