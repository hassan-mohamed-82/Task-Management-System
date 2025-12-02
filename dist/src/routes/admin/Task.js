"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Task_1 = require("../../controller/admin/Task");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const Task_2 = require("../../validation/admin/Task");
const multer_1 = require("../../utils/multer"); // ملف multer اللي عملته
const authorized_1 = require("../../middlewares/authorized");
const route = (0, express_1.Router)();
route.get("/", (0, authorized_1.authorizeRoles)("admin", "user"), (0, authorized_1.checkProjectOrTaskRole)(["teamlead", "admin"]), (0, catchAsync_1.catchAsync)(Task_1.getAllTasks));
route.get("/:id", (0, authorized_1.authorizeRoles)("admin", "user"), (0, authorized_1.checkProjectOrTaskRole)(["teamlead", "admin"]), (0, catchAsync_1.catchAsync)(Task_1.getTaskById));
route.post("/", (0, authorized_1.authorizeRoles)("admin", "user"), (0, authorized_1.checkProjectOrTaskRole)(["teamlead", "admin"]), multer_1.uploadTaskFiles, (0, validation_1.validate)(Task_2.createTaskSchema), (0, catchAsync_1.catchAsync)(Task_1.createTask));
route.post("/:id", (0, authorized_1.authorizeRoles)("admin", "user"), (0, authorized_1.checkProjectOrTaskRole)(["teamlead", "admin"]), (0, catchAsync_1.catchAsync)(Task_1.approveOrRejectTask));
route.put("/:id", (0, authorized_1.authorizeRoles)("admin", "user"), (0, authorized_1.checkProjectOrTaskRole)(["teamlead", "admin"]), (0, validation_1.validate)(Task_2.updateTaskSchema), (0, catchAsync_1.catchAsync)(Task_1.updateTask));
route.delete("/:id", (0, authorized_1.authorizeRoles)("admin", "user"), (0, authorized_1.checkProjectOrTaskRole)(["teamlead", "admin"]), (0, catchAsync_1.catchAsync)(Task_1.deleteTask));
exports.default = route;
