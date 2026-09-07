// ─────────────────────────────────────────────────────────────────────────────
// Social Pulse — TikTok Provider (DISABLED STUB)
// ─────────────────────────────────────────────────────────────────────────────
// API Classification: ⛔ RESTRICTED — No commercial discovery API
//
// REASON FOR DISABLING:
// TikTok (August 2026) does NOT provide a commercial-grade content
// discovery API for general developers or businesses.
//
// Specific limitations verified:
// 1. Research API — Academic/non-profit only, not for commercial use,
//    1000 req/day limit, 48hr data delay
// 2. Content Posting API — Upload only, not for searching
// 3. Display API — Only embeds a specific user's own content
// 4. Marketing/Ads API — Ad performance data only
// 5. NO location-based public video search for commercial use
//
// This provider is a STUB that returns no data and reports itself as disabled.
// It is kept in the codebase as a scaffold for future activation.
//
// DO NOT:
// - Scrape TikTok
// - Use unofficial wrapper APIs
// - Bypass rate limits or anti-bot systems
// - Fabricate TikTok data
// ─────────────────────────────────────────────────────────────────────────────

import {
  SocialProvider,
  NormalizedSocialContent,
  DestinationEntity,
  ProviderStatus,
} from '../socialTypes';

export class TikTokProvider implements SocialProvider {
  getProviderName(): string {
    return 'TikTok';
  }

  getStatus(): ProviderStatus {
    // TikTok commercial discovery API is not available
    return 'disabled';
  }

  isAvailable(): boolean {
    return false;
  }

  async searchContent(
    _entity: DestinationEntity,
    _limit?: number
  ): Promise<NormalizedSocialContent[]> {
    // TikTok does not provide a commercial content discovery API.
    // This is intentionally a no-op.
    return [];
  }

  async getTrendingContent(
    _entity: DestinationEntity,
    _limit?: number
  ): Promise<NormalizedSocialContent[]> {
    return [];
  }
}
