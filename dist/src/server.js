"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const Errors_1 = require("./Errors");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const connection_1 = require("./models/connection");
const taskActivation_1 = require("./utils/taskActivation");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
(0, connection_1.connectDB)();
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use((0, cors_1.default)({ origin: "*" }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "20mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "20mb" }));
// نطبع المسار الحالي
console.log("__dirname =", __dirname);
// نحدد فولدر uploads حسب التشغيل (لوكال src ولا dist في السيرفر)
const uploadsPath = __dirname.includes("dist")
    ? path_1.default.join(__dirname, "uploads") // في السيرفر: dist/uploads
    : path_1.default.join(__dirname, "../uploads"); // في اللوكال: ../uploads من src
console.log("Serving uploads from:", uploadsPath);
// هنا بنخدم أي files جوه uploads
app.use("/uploads", express_1.default.static(uploadsPath));
// Routes
app.use("/api", routes_1.default);
// 404 handler
app.use((req, res, next) => {
    throw new Errors_1.NotFound("Route not found");
});
// Error handler
app.use(errorHandler_1.errorHandler);
const server = http_1.default.createServer(app);
(0, taskActivation_1.startTaskScheduler)();
server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
