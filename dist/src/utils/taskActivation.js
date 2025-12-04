"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTaskScheduler = void 0;
// jobs/taskScheduler.ts
const node_cron_1 = __importDefault(require("node-cron"));
const Tasks_1 = require("../models/schema/Tasks");
const startTaskScheduler = () => {
    // يشتغل كل يوم الساعة 12:01 صباحاً
    node_cron_1.default.schedule("1 0 * * *", async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // ✅ تفعيل الـ Tasks اللي جه تاريخها
            const activatedTasks = await Tasks_1.TaskModel.updateMany({
                start_date: { $lte: today },
                is_active: false,
                status: null,
            }, {
                $set: {
                    is_active: true,
                    status: "Pending",
                },
            });
            if (activatedTasks.modifiedCount > 0) {
                console.log(`✅ [${new Date().toISOString()}] Activated ${activatedTasks.modifiedCount} tasks`);
            }
        }
        catch (error) {
            console.error("❌ Task scheduler error:", error);
        }
    });
    console.log("📅 Task scheduler started - runs daily at 00:01");
};
exports.startTaskScheduler = startTaskScheduler;
