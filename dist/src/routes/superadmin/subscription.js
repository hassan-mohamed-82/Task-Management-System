"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscriptions_1 = require("../../controller/superadmin/subscriptions");
const catchAsync_1 = require("../../utils/catchAsync");
const route = (0, express_1.Router)();
route.get("/", (0, catchAsync_1.catchAsync)(subscriptions_1.getAllSubscription));
route.get("/:id", (0, catchAsync_1.catchAsync)(subscriptions_1.getSubscriptionById));
exports.default = route;
