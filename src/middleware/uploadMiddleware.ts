// uploadMiddleware.ts
import multer , { FileFilterCallback }  from "multer";

const memory = multer.memoryStorage();

export const imageUpload = multer({
  storage: memory,
  fileFilter: (_req, file, cb: FileFilterCallback) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(null, false),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const docUpload = multer({
  storage: memory,
  fileFilter: (_req, file, cb: FileFilterCallback) =>
    file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(null, false),
  limits: { fileSize: 10 * 1024 * 1024 },
});
