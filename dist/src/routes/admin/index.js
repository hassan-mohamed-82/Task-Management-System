"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.route = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const project_1 = __importDefault(require("./project"));
const subscription_1 = __importDefault(require("./subscription"));
const authenticated_1 = require("../../middlewares/authenticated");
const authorized_1 = require("../../middlewares/authorized");
exports.route = (0, express_1.Router)();
exports.route.use("/auth", auth_1.default);
exports.route.use(authenticated_1.authenticated, (0, authorized_1.authorizeRoles)('admin'));
exports.route.use("/project", project_1.default);
exports.route.use("/subscriptions", subscription_1.default);
exports.default = exports.route;
