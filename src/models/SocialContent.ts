import mongoose, { Schema, Document } from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Social Content Model — MongoDB Persistence Layer
// ─────────────────────────────────────────────────────────────────────────────
// Stores normalized social content for persistence and analytics.
// Redis handles hot caching; MongoDB handles longer-term storage and querying.
//
// Indexes:
// - provider + externalId (unique) — prevents duplicates
// - locationName — enables destination-based queries
// - publishedAt — enables recency queries
// - trendScore — enables trending queries
// - expiresAt (TTL) — auto-cleanup of stale content
// ─────────────────────────────────────────────────────────────────────────────

export interface ISocialContent extends Document {
  provider: string;
  externalId: string;
  contentType: string;
  title: string;
  description?: string;
  author?: string;
  authorUrl?: string;
  contentUrl: string;
  thumbnailUrl?: string;
  publishedAt?: Date;
  duration?: number;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  hashtags: string[];
  views?: number;
  likes?: number;
  comments?: number;
  engagementRate?: number;
  relevanceScore: number;
  trendScore: number;
  rawProvider: any;
  lastFetchedAt: Date;
  expiresAt: Date;
}

const SocialContentSchema = new Schema<ISocialContent>({
  provider: { type: String, required: true, index: true },
  externalId: { type: String, required: true },
  contentType: {
    type: String,
    enum: ['image', 'video', 'reel', 'short', 'post', 'place', 'event'],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String },
  author: { type: String },
  authorUrl: { type: String },
  contentUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  publishedAt: { type: Date },
  duration: { type: Number },
  locationName: { type: String, index: true },
  latitude: { type: Number },
  longitude: { type: Number },
  hashtags: [{ type: String }],
  views: { type: Number },
  likes: { type: Number },
  comments: { type: Number },
  engagementRate: { type: Number },
  relevanceScore: { type: Number, default: 0 },
  trendScore: { type: Number, default: 0, index: true },
  rawProvider: { type: Schema.Types.Mixed },
  lastFetchedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
});

// Compound unique index: one entry per provider+externalId
SocialContentSchema.index({ provider: 1, externalId: 1 }, { unique: true });

// publishedAt index for recency queries
SocialContentSchema.index({ publishedAt: -1 });

// TTL index: auto-delete expired content (7 days default)
SocialContentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.SocialContent ||
  mongoose.model<ISocialContent>('SocialContent', SocialContentSchema);
