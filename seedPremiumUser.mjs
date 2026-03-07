import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function seedPremiumUser() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI in environment variables.');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const email = 'premium@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const UserSchema = new mongoose.Schema({
      name: { type: String },
      email: { type: String, unique: true },
      password: { type: String },
      role: { type: String },
      plan: { type: String },
      emailVerified: { type: Boolean },
    }, { strict: false });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.plan = 'pro';
      existingUser.role = 'user';
      existingUser.emailVerified = true;
      existingUser.password = hashedPassword;
      await existingUser.save();
      console.log('✅ Updated existing premium user:', email);
    } else {
      await User.create({
        name: 'Premium Tester',
        email,
        password: hashedPassword,
        role: 'user',
        plan: 'pro',
        emailVerified: true,
      });
      console.log('✅ Created new premium user:', email);
    }

    console.log('Test Account Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('❌ Error seeding premium user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedPremiumUser();
