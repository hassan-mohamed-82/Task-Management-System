import express from "express";
import http from "http";
import ApiRoute from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { NotFound } from "./Errors";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { connectDB } from "./models/connection";
import { startTaskScheduler } from "./utils/taskActivation";
import path from "path";

dotenv.config();

const app = express();
connectDB();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: "*" }));
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// نطبع المسار الحالي
console.log("__dirname =", __dirname);

// نحدد فولدر uploads حسب التشغيل (لوكال src ولا dist في السيرفر)
const uploadsPath = __dirname.includes("dist")
  ? path.join(__dirname, "uploads")      // في السيرفر: dist/uploads
  : path.join(__dirname, "../uploads");  // في اللوكال: ../uploads من src

console.log("Serving uploads from:", uploadsPath);

// هنا بنخدم أي files جوه uploads
app.use("/uploads", express.static(uploadsPath));

// Routes
app.use("/api", ApiRoute);

// 404 handler
app.use((req, res, next) => {
  throw new NotFound("Route not found");
});

// Error handler
app.use(errorHandler);

const server = http.createServer(app);

startTaskScheduler();
server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
