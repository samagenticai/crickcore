import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { ApiError } from "../utils/helpers.js";
import {
  isCloudinaryConfigured,
  requiresCloudinaryUploads,
  uploadImageBuffer,
} from "../utils/cloudinaryStorage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const mime = String(file.mimetype || "").toLowerCase();
  const extOk = ALLOWED_EXT.has(ext);
  const mimeOk = ALLOWED_MIME.has(mime);

  if (mimeOk || extOk) {
    cb(null, true);
    return;
  }

  cb(
    new ApiError(
      400,
      "Invalid image type. Please upload a JPG, JPEG, PNG, or WEBP file."
    ),
    false
  );
};

/** Memory storage — required for Cloudinary; works in serverless environments. */
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

/**
 * Resolve a multer file to a public URL.
 * Production/Vercel: Cloudinary HTTPS URL.
 * Development: local /uploads path when Cloudinary is not configured.
 */
export async function resolveUpload(file, folder = "uploads") {
  if (!file) return null;

  if (isCloudinaryConfigured()) {
    return uploadImageBuffer(file.buffer, folder, file.originalname || "image.jpg");
  }

  if (requiresCloudinaryUploads()) {
    throw new ApiError(
      503,
      "Image uploads require Cloudinary in production. Configure CLOUDINARY_* environment variables."
    );
  }

  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = path.extname(file.originalname || "").toLowerCase();
  const filename = `${unique}${ALLOWED_EXT.has(ext) ? ext : ".jpg"}`;
  fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
  return `/uploads/${filename}`;
}

/** @deprecated Use resolveUpload for new uploads. Kept for legacy paths already stored in DB. */
export const getFileUrl = (filename) => `/uploads/${filename}`;

export const uploadAvatarMiddleware = (req, res, next) => {
  const handler = upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "profilePicture", maxCount: 1 },
  ]);

  handler(req, res, (err) => {
    if (!err) {
      const file =
        req.files?.avatar?.[0] || req.files?.profilePicture?.[0] || null;
      if (file) req.file = file;
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new ApiError(400, "Image must be 5 MB or smaller."));
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return next(
          new ApiError(400, 'Upload the image using the field name "avatar".')
        );
      }
      return next(new ApiError(400, err.message || "Image upload failed."));
    }

    if (err instanceof ApiError) return next(err);
    return next(new ApiError(400, err.message || "Invalid image file."));
  });
};
