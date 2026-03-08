export function validateEnv() {
  const requiredVars = [
    "NEXTAUTH_SECRET",
    "MONGODB_URI",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "OPENWEATHER_API_KEY",
    "MAPBOX_ACCESS_TOKEN",
    "RESEND_API_KEY",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
    "TURNSTILE_SECRET_KEY",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(", ")}`;
    if (process.env.NODE_ENV === "production" && process.env.SKIP_ENV_VALIDATION !== "true") {
       throw new Error(errorMsg);
    } else {
       console.warn(`[DEV WARNING] ${errorMsg}`);
    }
  }
}
