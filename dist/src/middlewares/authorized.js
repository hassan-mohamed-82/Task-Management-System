"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = void 0;
const unauthorizedError_1 = require("../Errors/unauthorizedError");
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user?.role || !roles.includes(req.user.role)) {
            throw new unauthorizedError_1.UnauthorizedError();
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
