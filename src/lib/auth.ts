import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { metrics } from "@/lib/metrics";
import { applyRateLimit } from "@/lib/rateLimit";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        emailOrPhone: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        const { emailOrPhone, password, otp } = credentials as any;

        if (!emailOrPhone || !password) {
          metrics.trackAuthAttempt("credentials", false);
          throw new Error("Missing credentials");
        }

        const rateLimitRes = applyRateLimit(emailOrPhone || "anon");
        if (!rateLimitRes.success) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        await connectDB();
        
        const isEmail = emailOrPhone.includes("@");
        const query = isEmail ? { email: emailOrPhone } : { phone: emailOrPhone };

        const user = await User.findOne(query);

        if (!user || (!user.password)) {
          metrics.trackAuthAttempt("credentials", false);
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password as string);

        if (!isPasswordValid) {
          metrics.trackAuthAttempt("credentials", false, user._id.toString());
          throw new Error("Invalid credentials");
        }

        // Check if OTP is provided (either for 2FA or initial verification)
        if (otp) {
          const isEmailOtpValid = user.emailOtp && user.emailOtpExpires && user.emailOtpExpires > new Date() && await bcrypt.compare(otp, user.emailOtp);
          const isPhoneOtpValid = user.phoneOtp && user.phoneOtpExpires && user.phoneOtpExpires > new Date() && await bcrypt.compare(otp, user.phoneOtp);

          if (!isEmailOtpValid && !isPhoneOtpValid) {
            metrics.trackAuthAttempt("otp_verify", false, user._id.toString());
            throw new Error("Invalid or expired OTP");
          }

          // Success, clear OTPs and mark as verified
          if (isEmailOtpValid) {
            user.emailOtp = undefined;
            user.emailOtpExpires = undefined;
            user.emailVerified = true;
          }
          if (isPhoneOtpValid) {
            user.phoneOtp = undefined;
            user.phoneOtpExpires = undefined;
            user.phoneVerified = true;
          }
          await user.save();
        } else {
          // No OTP provided. Check if 2FA is required.
          if (user.twoFactorEnabled && user.twoFactorMethods && user.twoFactorMethods.length > 0) {
            throw new Error("2FA_REQUIRED");
          }

          // If no 2FA, check if initial verification is required.
          if (isEmail && user.emailVerified === false) {
             throw new Error("UNVERIFIED_EMAIL");
          }
          if (!isEmail && user.phoneVerified === false) {
             throw new Error("UNVERIFIED_PHONE");
          }
        }

        metrics.trackAuthAttempt("credentials", true, user._id.toString());
        return {
          id: user._id.toString(),
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role,
          plan: user.plan || "free",
          emailVerified: user.emailVerified || false,
          phoneVerified: user.phoneVerified || false,
          twoFactorEnabled: user.twoFactorEnabled || false,
          twoFactorMethods: user.twoFactorMethods || [],
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
        if (session.email !== undefined) token.email = session.email;
        if (session.phone !== undefined) token.phone = session.phone;
        if (session.emailVerified !== undefined) token.emailVerified = session.emailVerified;
        if (session.phoneVerified !== undefined) token.phoneVerified = session.phoneVerified;
        if (session.twoFactorEnabled !== undefined) token.twoFactorEnabled = session.twoFactorEnabled;
        if (session.twoFactorMethods !== undefined) token.twoFactorMethods = session.twoFactorMethods;
      }
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "free";
        token.plan = (user as any).plan || "free";
        token.phone = (user as any).phone;
        token.emailVerified = (user as any).emailVerified || false;
        token.phoneVerified = (user as any).phoneVerified || false;
        token.twoFactorEnabled = (user as any).twoFactorEnabled || false;
        token.twoFactorMethods = (user as any).twoFactorMethods || [];
        if (user.image) {
          token.picture = user.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).plan = token.plan as string;
        (session.user as any).phone = token.phone as string | undefined;
        (session.user as any).emailVerified = token.emailVerified as boolean;
        (session.user as any).phoneVerified = token.phoneVerified as boolean;
        (session.user as any).twoFactorEnabled = token.twoFactorEnabled as boolean;
        (session.user as any).twoFactorMethods = token.twoFactorMethods as string[];
        if (token.picture) {
          session.user.image = token.picture as string;
        } else if ((token as any).image) {
          session.user.image = (token as any).image as string;
        }
      }
      return session;
    }
  },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
