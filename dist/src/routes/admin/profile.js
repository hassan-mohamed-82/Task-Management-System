"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_1 = require("../../controller/admin/profile");
const router = (0, express_1.Router)();
router.get("/", profile_1.getprofile);
router.put("/", profile_1.updateprofile);
router.delete("/", profile_1.deleteprofile);
exports.default = router;
