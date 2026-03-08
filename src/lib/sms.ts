import { logger } from "@/lib/logger";

interface SMSPayload {
  to: string;
  body: string;
}

/**
 * Enterprise Grade SMS Service powered by Twilio REST API
 * Falls back to local logging if API keys are absent.
 */
export async function sendSMS({ to, body }: SMSPayload) {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    logger.warn(`[Mock SMS] To: ${to} | Body: ${body}`);
    return { success: true, mocked: true };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const basicAuth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    
    const params = new URLSearchParams();
    params.append("To", to);
    params.append("From", TWILIO_PHONE_NUMBER);
    params.append("Body", body);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errResponse = await res.json();
      logger.error("Failed to send SMS via Twilio", { error: errResponse });
      throw new Error("SMS dispatch failed");
    }

    const data = await res.json();
    logger.info("SMS dispatched successfully", { sid: data.sid, to });
    return { success: true, sid: data.sid };

  } catch (error) {
    logger.error("Fatal error dispatching SMS", { error });
    return { success: false, error };
  }
}
