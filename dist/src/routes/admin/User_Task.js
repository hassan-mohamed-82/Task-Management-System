"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_Task_1 = require("../../controller/admin/User_Task");
const catchAsync_1 = require("../../utils/catchAsync");
const route = (0, express_1.Router)();
// إضافة يوزر للتاسك → فقط Admin/Administrator
route.post("/", (0, catchAsync_1.catchAsync)(User_Task_1.addUserTask));
// جلب كل اليوزرز في التاسك
route.get("/:taskId", (0, catchAsync_1.catchAsync)(User_Task_1.getalluserattask));
// حذف يوزر من التاسك → فقط Admin/Administrator
route.delete("/:taskId/:user_id", (0, catchAsync_1.catchAsync)(User_Task_1.removeUserFromTask));
// تحديث حالة التاسك → فقط Admin/Administrator، و Task يجب أن تكون done
route.put("/:taskId/:userId", (0, catchAsync_1.catchAsync)(User_Task_1.updateTaskStatus));
exports.default = route;
