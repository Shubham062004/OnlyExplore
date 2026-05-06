import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const DEV_USERS = [
  {
    email: "pro@test.com",
    password: "Test@123",
    name: "Pro User",
    plan: "pro" as const,
    role: "pro",
    emailVerified: true,
    subscriptionStatus: "active" as const,
  },
  {
    email: "user@test.com",
    password: "Test@123",
    name: "Normal User",
    plan: "free" as const,
    role: "free",
    emailVerified: true,
    subscriptionStatus: null,
  },
];

/**
 * Seeds development-only test users into MongoDB.
 * ⚠️ This function is a NO-OP in production — safe to call unconditionally.
 */
export async function seedUsers(): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;

  try {
    await connectDB();

    for (const userData of DEV_USERS) {
      const exists = await User.findOne({ email: userData.email }).lean();
      if (exists) {
        // Already seeded — skip silently
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      await User.create({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        plan: userData.plan,
        role: userData.role,
        emailVerified: userData.emailVerified,
        subscriptionStatus: userData.subscriptionStatus,
      });

      console.log(`🌱 [SeedUsers] Created dev user: ${userData.email} (${userData.plan})`);
    }
  } catch (err) {
    // Non-fatal: log and continue — do not crash the app
    console.error("⚠️ [SeedUsers] Failed to seed dev users:", err);
  }
}
