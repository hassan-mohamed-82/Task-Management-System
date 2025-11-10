"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticated = authenticated;
const auth_1 = require("../utils/auth");
const unauthorizedError_1 = require("../Errors/unauthorizedError");
function authenticated(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new unauthorizedError_1.UnauthorizedError("Authorization token missing or invalid");
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = (0, auth_1.verifyToken)(token);
        // حفظ بيانات المستخدم في req.user
        req.user = decoded;
        next();
    }
    catch (error) {
        throw new unauthorizedError_1.UnauthorizedError("Invalid or expired token");
    }
}
