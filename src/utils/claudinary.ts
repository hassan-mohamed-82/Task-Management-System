import multer from 'multer';
import path from 'path';

// تخزين الملفات العادية
const storageFile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/files'); // مجلد تخزين الملفات
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// تخزين التسجيلات الحية
const storageRecord = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/records'); // مجلد التخزين للتسجيلات
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

export const uploadFile = multer({ storage: storageFile });
export const uploadRecord = multer({ storage: storageRecord });
