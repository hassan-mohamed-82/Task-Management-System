"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRecord = exports.uploadFile = void 0;
const multer_1 = __importDefault(require("multer"));
// تخزين الملفات العادية
const storageFile = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/files'); // مجلد تخزين الملفات
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
// تخزين التسجيلات الحية
const storageRecord = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/records'); // مجلد التخزين للتسجيلات
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
exports.uploadFile = (0, multer_1.default)({ storage: storageFile });
exports.uploadRecord = (0, multer_1.default)({ storage: storageRecord });
