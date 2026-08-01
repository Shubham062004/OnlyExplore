import { logger } from "./logger";

export const metrics = {
  trackApiDuration: (route: string, durationMs: number) => {
    logger.info("API Duration", {
      metric: "api.duration",
      route,
      durationMs,
    });
  },

  trackAiGeneration: (flowName: string, durationMs: number, success: boolean) => {
    logger.info("AI Generation", {
      metric: "ai.generation",
      flowName,
      durationMs,
      success,
    });
  },

  trackAuthAttempt: (method: string, success: boolean, userId?: string) => {
    logger.info("Auth Attempt", {
      metric: "auth.attempt",
      method,
      success,
      userId,
    });
  },

  trackStripeCheckout: (priceId: string, status: string, userId?: string) => {
    logger.info("Stripe Checkout Event", {
      metric: "stripe.checkout",
      priceId,
      status,
      userId,
    });
  },

  trackCacheHit: (cacheLevel: "L0_Memory" | "L1_Redis" | "L2_MongoDB", hit: boolean, key: string) => {
    logger.info("Cache Status", {
      metric: "cache.hit",
      cacheLevel,
      hit,
      key,
    });
  },

  trackSearchQuery: (query: string, resultCount: number) => {
    logger.info("Search Metric", {
      metric: "search.query",
      query,
      resultCount,
    });
  },
};
