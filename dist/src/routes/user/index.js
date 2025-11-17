"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = __importDefault(require("../user/auth/index"));
const payment_1 = __importDefault(require("./payment"));
const payment_method_1 = __importDefault(require("./payment_method"));
const Project_1 = __importDefault(require("./Project"));
const plans_1 = __importDefault(require("./plans"));
const Taske_1 = __importDefault(require("./Taske"));
const authenticated_1 = require("../../middlewares/authenticated");
const authorized_1 = require("../../middlewares/authorized");
const route = (0, express_1.Router)();
route.use("/auth", index_1.default);
route.use(authenticated_1.authenticated, (0, authorized_1.authorizeRoles)('user', 'admin'));
route.use("/payment-methods", payment_method_1.default);
route.use("/payments", payment_1.default);
route.use("/plans", plans_1.default);
route.use("/projects", 
// authorizeRoleAtProject(['member','viewer']), 
Project_1.default);
route.use("/tasks", 
// authorizeRoleAtProject(['member'])
Taske_1.default);
exports.default = route;
