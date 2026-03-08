import { NextResponse } from "next/server";

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitTracker>();
const ATTEMPTS_LIMIT = 5;
const RESET_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function applyRateLimit(ip: string | undefined | null) {
  const defaultIp = ip || "anonymous_ip";
  const now = Date.now();
  const record = rateLimitMap.get(defaultIp);

  if (!record) {
    rateLimitMap.set(defaultIp, { count: 1, resetTime: now + RESET_WINDOW_MS });
    return { success: true };
  }

  if (now > record.resetTime) {
    rateLimitMap.set(defaultIp, { count: 1, resetTime: now + RESET_WINDOW_MS });
    return { success: true };
  }

  if (record.count >= ATTEMPTS_LIMIT) {
    return { success: false, remainingTime: record.resetTime - now };
  }

  record.count += 1;
  return { success: true };
}

// Clean up stale entries periodically to prevent memory leaks in serverful environments
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RESET_WINDOW_MS);
