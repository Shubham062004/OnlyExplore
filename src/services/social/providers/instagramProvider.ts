// ─────────────────────────────────────────────────────────────────────────────
// Social Pulse — Instagram Provider (DISABLED STUB)
// ─────────────────────────────────────────────────────────────────────────────
// API Classification: ⛔ RESTRICTED — No public discovery API
//
// REASON FOR DISABLING:
// The Instagram Graph API (August 2026) does NOT support arbitrary
// location-based public content discovery. It is strictly an
// "own-account management" API for Business/Creator accounts.
//
// Specific limitations verified:
// 1. NO location-based search endpoint
// 2. Hashtag search requires App Review approval + is capped at 30 unique
//    hashtags per 7-day window per Business account
// 3. Only provides access to the authenticated user's own content
// 4. Requires a Facebook Page linked to a Business/Creator account
// 5. No cross-account or public feed discovery
//
// This provider is a STUB that returns no data and reports itself as disabled.
// It is kept in the codebase as a scaffold for future activation if Meta
// opens up public discovery capabilities.
//
// DO NOT:
// - Scrape Instagram
// - Use unofficial/private APIs
// - Bypass authentication or anti-bot systems
// - Fabricate Instagram data
// ─────────────────────────────────────────────────────────────────────────────

import {
  SocialProvider,
  NormalizedSocialContent,
  DestinationEntity,
  ProviderStatus,
} from '../socialTypes';

export class InstagramProvider implements SocialProvider {
  getProviderName(): string {
    return 'Instagram';
  }

  getStatus(): ProviderStatus {
    // Instagram public discovery is not officially available
    return 'disabled';
  }

  isAvailable(): boolean {
    return false;
  }

  async searchContent(
    _entity: DestinationEntity,
    _limit?: number
  ): Promise<NormalizedSocialContent[]> {
    // Instagram Graph API does not support public content discovery.
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
