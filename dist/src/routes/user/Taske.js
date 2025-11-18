"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taske_1 = require("../../controller/user/taske");
const catchAsync_1 = require("../../utils/catchAsync");
const route = (0, express_1.Router)();
route.get("/", (0, catchAsync_1.catchAsync)(taske_1.getMyTasks));
// جلب المهام الخاصة باليوزر لمشروع معين
route.get("/:project_id", (0, catchAsync_1.catchAsync)(taske_1.getUserTasksByProject));
// تعديل حالة مهمة خطوة خطوة
route.put("/:taskId", (0, catchAsync_1.catchAsync)(taske_1.updateUserTaskStatus));
// طلب الموافقة على المهمة
route.put("/request/:taskId", (0, catchAsync_1.catchAsync)(taske_1.requestTaskApproval));
// جلب كل اليوزرز في التاسك
route.get("/:taskId", (0, catchAsync_1.catchAsync)(taske_1.getalluserattask));
// حذف يوزر من التاسك → فقط Admin/Administrator
route.delete("/:taskId/:user_id", (0, catchAsync_1.catchAsync)(taske_1.removeUserFromTask));
// اضافة يوزر للتاسك → فقط Admin/Administrator
route.post("/", (0, catchAsync_1.catchAsync)(taske_1.addUserTask));
// تحديث حالة التاسك → فقط Admin/Administrator، و Task يجب أن تكون done
route.put("/:taskId/:userId", (0, catchAsync_1.catchAsync)(taske_1.updateTaskStatus));
exports.default = route;
