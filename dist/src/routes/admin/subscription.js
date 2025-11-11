"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_1 = require("../../controller/admin/subscription");
const catchAsync_1 = require("../../utils/catchAsync");
const route = (0, express_1.Router)();
route.get("/", (0, catchAsync_1.catchAsync)(subscription_1.getSubscription));
route.get("/:id", (0, catchAsync_1.catchAsync)(subscription_1.getSubscriptionId));
exports.default = route;
