import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import path from "path";
import { NotFound, UnauthorizedError } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { ProjectModel } from "../../models/schema/project";
import { TaskModel } from "../../models/schema/Tasks";
import { UserProjectModel } from "../../models/schema/User_Project";
import { UserTaskModel } from "../../models/schema/User_Task";
import { UserRejectedReason } from "../../models/schema/User_Rejection";
import { RejectedReson } from "../../models/schema/RejectdReson";
import { User } from "../../models/schema/auth/User";

const toPublicPath = (p: string | null | undefined) => {
  if (!p) return null;

  // نخلي السلاشات كلها /
  const normalized = p.replace(/\\/g, "/"); // مثال: "D:/Task shit/dist/uploads/tasks/xx.pdf"

  // ندور على uploads/
  const lower = normalized.toLowerCase();
  let idx = lower.indexOf("/uploads/");
  if (idx === -1) idx = lower.indexOf("uploads/");
  if (idx === -1) return null; // لو مفيش كلمة uploads في المسار

  // نرجع من بعد الـ / لو موجودة قدام uploads
  const start = normalized[idx] === "/" ? idx + 1 : idx;

  // مثال الناتج: "uploads/tasks/xx.pdf"
  return normalized.substring(start);
};

const buildUrl = (p: string | null | undefined, req: Request) => {
  const publicPath = toPublicPath(p);
  if (!publicPath) return null;
  return `${req.protocol}://${req.get("host")}/${publicPath}`;
};


export const createTask = async (req: Request, res: Response) => {
  const user = req.user?._id;
  if (!user) throw new UnauthorizedError("Access denied.");

  const { name, description, projectId, priority, start_date, end_date, Depatment_id } = req.body;

  if (!name) throw new BadRequest("Task name is required");
  if (!projectId) throw new BadRequest("Project ID is required");

  const project = await ProjectModel.findById(projectId);
  if (!project) throw new NotFound("Project not found");

  const checkuseratproject = await UserProjectModel.findOne({
    user_id: user,
    project_id: projectId,
  });

  const role = req.user?.role?.toLowerCase();
  if (role !== "admin") {
    const userProjectRole = checkuseratproject?.role?.toLowerCase() ?? "";
    if (!checkuseratproject || ["member", "membercanapprove"].includes(userProjectRole)) {
      throw new UnauthorizedError("You can't create a task for this project");
    }
  }

  // ✅ تحويل التواريخ
  const startDateObj = start_date ? new Date(start_date) : null;
  const endDateObj = end_date ? new Date(end_date) : null;

  // ✅ تحديد هل يتفعل الآن أو ينتظر
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let shouldBeActive = false;
  let initialStatus = null;

  if (startDateObj) {
    const startDay = new Date(startDateObj);
    startDay.setHours(0, 0, 0, 0);

    if (startDay <= today) {
      // التاريخ اليوم أو في الماضي → يتفعل فوراً
      shouldBeActive = true;
      initialStatus = "Pending";
    }
    // لو في المستقبل → يفضل inactive وينتظر الـ Cron
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const filePath = files?.file?.[0]?.path || null;
  const recordPath = files?.recorde?.[0]?.path || null;

  const task = new TaskModel({
    name,
    description,
    projectId: new Types.ObjectId(projectId),
    priority,
    start_date: startDateObj,
    end_date: endDateObj,
    Depatment_id: Depatment_id ? new Types.ObjectId(Depatment_id) : undefined,
    file: filePath,
    recorde: recordPath,
    createdBy: user,
    is_active: shouldBeActive,
    status: initialStatus,
  });

  await task.save();

  const publicFilePath = toPublicPath(task.file);
  const publicRecordPath = toPublicPath(task.recorde);

  const fileUrl = publicFilePath
    ? `${req.protocol}://${req.get("host")}/${publicFilePath}`
    : null;

  const recordUrl = publicRecordPath
    ? `${req.protocol}://${req.get("host")}/${publicRecordPath}`
    : null;

  SuccessResponse(res, {
    message: "Task created successfully",
    task: { ...task.toObject(), file: fileUrl, recorde: recordUrl },
  });
};



// --------------------------
// GET ALL TASKS  (FIXED for SaaS)
// --------------------------
export const getAllTasks = async (req: Request, res: Response) => {
  const user = req.user?._id;
  if (!user) throw new UnauthorizedError("Access denied.");

  // هات كل المشاريع اللي المستخدم موجود فيها
  const userProjects = await UserProjectModel.find({ user_id: user });

  if (!userProjects.length)
    throw new UnauthorizedError("You are not assigned to any project.");

  const projectIds = userProjects.map((p) => p.project_id);

  // هات التاسكات الخاصة بالمشاريع دي فقط
  let tasks = await TaskModel.find({ projectId: { $in: projectIds } })
    .populate("projectId")
    .populate("Depatment_id")
    .populate("createdBy", "name email")
    .lean();

  // ظبط الـ file / recorde URLs
  tasks = tasks.map((t: any) => ({
    ...t,
    file: buildUrl(t.file, req),
    recorde: buildUrl(t.recorde, req),
  }));

  // ✅ تقسيم الـ Tasks
  const activeTasks = tasks.filter((t: any) => t.is_active === true);
  const inactiveTasks = tasks.filter((t: any) => t.is_active === false);

  SuccessResponse(res, {
    message: "Tasks fetched successfully",
    activeTasks,
    inactiveTasks,
    summary: {
      total: tasks.length,
      active: activeTasks.length,
      inactive: inactiveTasks.length,
    },
  });
};

// --------------------------
// GET TASK BY ID
// --------------------------
export const getTaskById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest("Invalid Task ID");

  const taskDoc = await TaskModel.findById(id)
    .populate("projectId")
    .populate("Depatment_id")
    .populate("createdBy", "name email")
    .lean();

  if (!taskDoc) throw new NotFound("Task not found");

  const task = {
    ...taskDoc,
    file: buildUrl((taskDoc as any).file, req),
    recorde: buildUrl((taskDoc as any).recorde, req),
  };

  SuccessResponse(res, { message: "Task fetched successfully", task });
};


// --------------------------
// UPDATE TASK
// --------------------------
export const updateTask = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedError("Access denied.");

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest("Invalid Task ID");

  const task = await TaskModel.findById(id);
  if (!task) throw new NotFound("Task not found");

  // تحقق من أن المستخدم جزء من نفس المشروع
  const userProject = await UserProjectModel.findOne({
    user_id: userId,
    project_id: task.projectId
  });

  if (!userProject)
    throw new UnauthorizedError("You are not assigned to this project");

  const role = (userProject.role || "").toLowerCase();

  // فقط admin + teamlead يسمح لهم بالتعديل
  if (!["admin", "teamlead"].includes(role))
    throw new UnauthorizedError("You don't have permission to update this task");

  const updates: any = { ...req.body };

  // ملف جديد من multer
  if (req.file) updates.file = req.file.path;
  // تسجيل جديد لو جاي كنص
  if (req.body.recorde) updates.recorde = req.body.recorde;

  Object.assign(task, updates);
  await task.save();

  const taskObj = task.toObject();

  const responseTask = {
    ...taskObj,
    file: buildUrl(taskObj.file, req),
    recorde: buildUrl(taskObj.recorde, req),
  };

  SuccessResponse(res, {
    message: "Task updated successfully",
    task: responseTask,
  });
};

// ==========================
// DELETE TASK
// ==========================
export const deleteTask = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedError("Access denied.");

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest("Invalid Task ID");

  const task = await TaskModel.findById(id);
  if (!task) throw new NotFound("Task not found");

  // تحقق من الانتماء للمشروع
  const userProject = await UserProjectModel.findOne({
    user_id: userId,
    project_id: task.projectId
  });

  if (!userProject)
    throw new UnauthorizedError("You are not assigned to this project");

  const role = (userProject.role || "").toLowerCase();

  // فقط admin + teamlead يسمح لهم بالحذف
  if (!["admin", "teamlead"].includes(role))
    throw new UnauthorizedError("You don't have permission to delete this task");

  await TaskModel.findByIdAndDelete(id);
  await UserTaskModel.deleteMany({ task_id: id });

  SuccessResponse(res, { message: "Task deleted successfully" });
};


export const approveOrRejectTask = async (req: Request, res: Response) => {
  const adminId = req.user?._id;
  const currentRole = String(req.user?.role || "").toLowerCase();

  if (!["admin", "teamlead"].includes(currentRole)) {
    throw new UnauthorizedError("Only Admin or TeamLead can update task status");
  }

  const { id } = req.params; // ده Task ID مباشرة ✅
  const { status, rejection_reasonId } = req.body;

  if (!id) throw new BadRequest("Task ID is required");
  if (!status) throw new BadRequest("Status is required");

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequest("Invalid Task ID");
  }

  const task = await TaskModel.findOne({
    _id: id,
    createdBy: adminId,
  });

  if (!task) throw new NotFound("Task not found or you don't have access");

  // التأكد إن الـ Task جاهزة للـ Admin Review
  if (task.status !== "waiting_for_approve") {
    throw new BadRequest(
      `Cannot review task. Task must be 'waiting_for_approve', current: '${task.status}'`
    );
  }

  // ======================
  // ❌ REJECT
  // ======================
  if (status === "rejected") {
    if (!rejection_reasonId) {
      throw new BadRequest("Rejection reason is required");
    }

    const rejectionReason = await RejectedReson.findOne({
      _id: rejection_reasonId,
    });

    if (!rejectionReason) {
      throw new NotFound("Rejection reason not found in your workspace");
    }

    // نجيب كل الـ UserTasks المرتبطة بالـ Task
    const allUserTasks = await UserTaskModel.find({ task_id: task._id });

    // نعمل loop على كل UserTask ونزود النقاط لكل User
    for (const ut of allUserTasks) {
      // سجل سبب الرفض
      await UserRejectedReason.create({
        userId: ut.user_id,
        reasonId: rejection_reasonId,
        taskId: task._id,
      });

      // زود نقاط الرفض
      const pointsUser = await User.findById(ut.user_id);
      if (pointsUser) {
        pointsUser.totalRejectedPoints =
          (pointsUser.totalRejectedPoints || 0) + (rejectionReason.points || 0);
        await pointsUser.save();
      }
    }

    // كل الـ UserTasks → pending_edit
    await UserTaskModel.updateMany(
      { task_id: task._id },
      { status: "pending_edit", is_finished: false }
    );

    // Task → Pending
    task.status = "Pending";
    await task.save();
  }

  // ======================
  // ✅ APPROVE
  // ======================
  else if (status === "Approved") {
    // كل الـ UserTasks تبقى finished
    await UserTaskModel.updateMany(
      { task_id: task._id },
      { is_finished: true }
    );

    // Task → Approved
    task.status = "Approved";
    await task.save();
  }

  else {
    throw new BadRequest("Status must be either 'Approved' or 'rejected'");
  }

  SuccessResponse(res, {
    message: "Task status updated successfully",
    data: { task },
  });
};

export const toggleTaskStatus = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedError("Access denied.");

  const { id } = req.params;
  const { is_active } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequest("Invalid Task ID");
  if (typeof is_active !== "boolean") throw new BadRequest("is_active must be a boolean");

  const task = await TaskModel.findById(id);
  if (!task) throw new NotFound("Task not found");

  const userProject = await UserProjectModel.findOne({
    user_id: userId,
    project_id: task.projectId,
  });

  if (!userProject)
    throw new UnauthorizedError("You are not assigned to this project");

  const role = (userProject.role || "").toLowerCase();

  if (!["admin", "teamlead"].includes(role))
    throw new UnauthorizedError("You don't have permission to update this task");

  if (task.is_active === is_active) {
    throw new BadRequest(`Task is already ${is_active ? "active" : "inactive"}`);
  }

  if (is_active) {
    // ✅ تفعيل يدوي
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    task.is_active = true;
    task.status = "Pending";

    // لو مفيش start_date، نحط تاريخ اليوم
    if (!task.start_date) {
      task.start_date = today;
    }
  } else {
    // ✅ تعطيل
    task.is_active = false;
    task.status = "null";
    // start_date يفضل زي ما هو (مش بنمسحه)
  }

  await task.save();

  const taskObj = task.toObject();

  SuccessResponse(res, {
    message: `Task ${is_active ? "activated" : "deactivated"} successfully`,
    task: {
      ...taskObj,
      file: buildUrl(taskObj.file, req),
      recorde: buildUrl(taskObj.recorde, req),
    },
  });
};
