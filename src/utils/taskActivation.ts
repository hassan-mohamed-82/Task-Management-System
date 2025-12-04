// jobs/taskScheduler.ts
import cron from "node-cron";
import { TaskModel } from "../models/schema/Tasks";

export const startTaskScheduler = () => {
  // يشتغل كل يوم الساعة 12:01 صباحاً
  cron.schedule("1 0 * * *", async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // ✅ تفعيل الـ Tasks اللي جه تاريخها
      const activatedTasks = await TaskModel.updateMany(
        {
          start_date: { $lte: today },
          is_active: false,
          status: null,
        },
        {
          $set: {
            is_active: true,
            status: "Pending",
          },
        }
      );

      if (activatedTasks.modifiedCount > 0) {
        console.log(`✅ [${new Date().toISOString()}] Activated ${activatedTasks.modifiedCount} tasks`);
      }

    } catch (error) {
      console.error("❌ Task scheduler error:", error);
    }
  });

  console.log("📅 Task scheduler started - runs daily at 00:01");
};
