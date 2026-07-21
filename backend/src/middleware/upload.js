import multer from "multer";
import path from "path";
import { ApiError } from "../utils/helpers.js";
import { isCloudinaryConfigured, uploadImageBuffer } from "../utils/cloudinaryStorage.js";

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

/** Memory storage only — required for Vercel/serverless and Cloudinary uploads. */
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

/**
 * Resolve a multer file to a public Cloudinary HTTPS URL.
 * Local disk storage is not supported (serverless-safe).
 */
export async function resolveUpload(file, folder = "uploads") {
  if (!file) return null;

  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      503,
      "Image uploads require Cloudinary. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  return uploadImageBuffer(file.buffer, folder, file.originalname || "image.jpg");
}

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
