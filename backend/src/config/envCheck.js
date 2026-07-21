/**
 * Validates required environment variables at startup.
 * Logs warnings for optional-but-recommended vars in production.
 */
export function validateEnvironment() {
  const required = ["MONGODB_URI", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]?.trim());

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const isProd =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_URL);

  if (isProd) {
    const prodRequired = [
      "CLIENT_URL",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ];
    const missingProdRequired = prodRequired.filter((key) => !process.env[key]?.trim());
    if (missingProdRequired.length) {
      throw new Error(
        `Missing required production environment variables: ${missingProdRequired.join(", ")}`
      );
    }

    const prodRecommended = ["STRIPE_SECRET_KEY"];
    const missingProd = prodRecommended.filter((key) => !process.env[key]?.trim());
    if (missingProd.length) {
      console.warn(
        `[env] Production deployment missing recommended variables: ${missingProd.join(", ")}`
      );
    }
  }
}
