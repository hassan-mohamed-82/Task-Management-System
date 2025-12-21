"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taske_1 = require("../../controller/user/taske");
const catchAsync_1 = require("../../utils/catchAsync");
const route = (0, express_1.Router)();
// 1) routes الثابتة الأول
route.get("/selection", (0, catchAsync_1.catchAsync)(taske_1.selection));
// 2) routes الخاصة بالمراجعة / تفاصيل التاسك
route.put("/review/:taskId", (0, catchAsync_1.catchAsync)(taske_1.reviewUserTaskByApprover));
// Route exclusive for "membercanapprove" role - returns comprehensive task details
route.get("/approver/:taskId", (0, catchAsync_1.catchAsync)(taske_1.getTaskDetailsForApprover));
route.get("/task/:taskId", (0, catchAsync_1.catchAsync)(taske_1.getTaskDetailsForUser));
// 3) في الآخر الـ routes الديناميكية العامة
route.put("/:taskId", (0, catchAsync_1.catchAsync)(taske_1.updateUserTaskStatus));
route.get("/:taskId", (0, catchAsync_1.catchAsync)(taske_1.getalltaskatprojectforuser));
exports.default = route;
