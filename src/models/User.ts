import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string;
  role: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "active" | "canceled" | "incomplete" | null;
  plan?: "free" | "pro";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    role: { type: String, default: "free" },
    stripeCustomerId: { type: String, required: false },
    stripeSubscriptionId: { type: String, required: false },
    subscriptionStatus: { type: String, required: false, enum: ["active", "canceled", "incomplete", null] },
    plan: { type: String, default: "free", enum: ["free", "pro"] },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
