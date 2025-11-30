"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const project_1 = __importDefault(require("./project"));
const subscription_1 = __importDefault(require("./subscription"));
const Task_1 = __importDefault(require("./Task"));
const Department_1 = __importDefault(require("./Department"));
const RejectdReson_1 = __importDefault(require("./RejectdReson"));
const profile_1 = __importDefault(require("./profile"));
const User_Project_1 = __importDefault(require("./User_Project"));
const User_Task_1 = __importDefault(require("./User_Task"));
const authenticated_1 = require("../../middlewares/authenticated");
const authorized_1 = require("../../middlewares/authorized");
const authorized_2 = require("../../middlewares/authorized");
const route = (0, express_1.Router)();
route.use("/auth", auth_1.default);
route.use(authenticated_1.authenticated);
route.use(authenticated_1.authenticated);
// /tasks route
route.use("/tasks", Task_1.default);
// /user-project route
route.use("/user-project", User_Project_1.default);
route.use("/user-task", (0, authorized_1.authorizeRoles)('admin', 'user'), (0, authorized_2.checkProjectOrTaskRole)(['teamlead', 'admin']), User_Task_1.default);
(0, authorized_1.authorizeRoles)('admin');
route.use("/profile", profile_1.default);
route.use("/project", project_1.default);
route.use("/subscriptions", subscription_1.default);
route.use("/departments", Department_1.default);
route.use("/rejected-reasons", RejectdReson_1.default);
exports.default = route;
