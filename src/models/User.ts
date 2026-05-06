import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email?: string;
  password?: string;
  role: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "active" | "canceled" | "incomplete" | null;
  plan?: "free" | "pro";
  emailVerified?: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  phone?: string;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorMethods?: string[];
  emailOtp?: string;
  emailOtpExpires?: Date;
  phoneOtp?: string;
  phoneOtpExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: false },
    email: { type: String, required: false, unique: true, sparse: true },
    password: { type: String, required: false },
    role: { type: String, default: "free" },
    stripeCustomerId: { type: String, required: false },
    stripeSubscriptionId: { type: String, required: false },
    subscriptionStatus: { type: String, required: false, enum: ["active", "canceled", "incomplete", null] },
    plan: { type: String, default: "free", enum: ["free", "pro"] },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, required: false },
    verificationTokenExpires: { type: Date, required: false },
    phone: { type: String, required: false, unique: true, sparse: true },
    phoneVerified: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethods: { type: [String], default: [] },
    emailOtp: { type: String, required: false },
    emailOtpExpires: { type: Date, required: false },
    phoneOtp: { type: String, required: false },
    phoneOtpExpires: { type: Date, required: false },
    passwordResetToken: { type: String, required: false },
    passwordResetExpires: { type: Date, required: false },
  },
  { timestamps: true }
);


export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
