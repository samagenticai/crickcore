import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./helpers.js";

let configured = false;

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function ensureConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      503,
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

/**
 * Upload an image buffer to Cloudinary. Returns the HTTPS secure URL.
 */
export async function uploadImageBuffer(buffer, folder = "uploads", originalName = "image.jpg") {
  if (!buffer?.length) {
    throw new ApiError(400, "Empty image buffer");
  }

  ensureConfigured();

  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const baseName = originalName.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").slice(0, 40);
  const publicId = `${Date.now()}-${baseName || "file"}`;

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: `cricket-match/${folder}`,
        public_id: publicId,
        resource_type: "image",
        format: ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : undefined,
      },
      (err, result) => {
        if (err) {
          reject(new ApiError(502, err.message || "Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      }
    );
    upload.end(buffer);
  });
}
