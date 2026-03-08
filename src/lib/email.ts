import { logger } from "@/lib/logger";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Enterprise Grade Email Service powered by Resend
 * Falls back to local logging if API key is not present.
 */
export async function sendEmail({ to, subject, html }: EmailPayload) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    logger.warn(`[Mock Email] To: ${to} | Subject: ${subject}`);
    logger.warn(`[Mock Email Content]: ${html}`);
    return { success: true, mocked: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OnlyExplore <noreply@onlyexplore.app>", // Update with verified domain later
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      logger.error("Failed to send email via Resend", { error: errorData });
      throw new Error("Email dispatch failed");
    }

    const data = await res.json();
    logger.info("Email dispatched successfully", { id: data.id, to });
    return { success: true, id: data.id };
  } catch (error) {
    logger.error("Fatal error dispatching email", { error });
    return { success: false, error };
  }
}
