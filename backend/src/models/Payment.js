import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },
    customerEmail: { type: String, default: "", lowercase: true, trim: true, index: true },
    plan: {
      type: String,
      enum: ["starter", "pro", "enterprise"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "usd", lowercase: true },
    stripeCheckoutSessionId: { type: String, default: "", index: true },
    stripePaymentIntentId: { type: String, default: "", index: true },
    stripeTransactionId: { type: String, default: "" },
    stripeCustomerId: { type: String, default: "" },
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "succeeded", "failed", "canceled", "refunded"],
      default: "pending",
      index: true,
    },
    paymentDate: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
