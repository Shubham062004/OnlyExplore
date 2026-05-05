// Run with: node scripts/seedUsers.mjs
// Seeds test users for local development/testing
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env');

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, sparse: true, unique: true },
    password: String,
    role: { type: String, default: 'free' },
    plan: { type: String, default: 'free' },
    emailVerified: { type: Boolean, default: false },
    subscriptionStatus: { type: String, default: null },
    phone: { type: String, sparse: true, unique: true },
    phoneVerified: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethods: { type: [String], default: [] },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const DEV_USERS = [
  {
    email: 'pro@test.com',
    password: 'Test@123',
    name: 'Pro User',
    plan: 'pro',
    role: 'pro',
    emailVerified: true,
    subscriptionStatus: 'active',
  },
  {
    email: 'user@test.com',
    password: 'Test@123',
    name: 'Normal User',
    plan: 'free',
    role: 'free',
    emailVerified: true,
    subscriptionStatus: null,
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const hashedPassword = await bcrypt.hash('Test@123', 10);

  for (const u of DEV_USERS) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`⏭️  Already exists: ${u.email} (${u.plan})`);
      continue;
    }

    await User.create({ ...u, password: hashedPassword });
    console.log(`✅ Created: ${u.email} (${u.plan})`);
  }

  console.log('\n🎉 Done! Test credentials:');
  console.log('   PRO   → pro@test.com   / Test@123');
  console.log('   FREE  → user@test.com  / Test@123');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
