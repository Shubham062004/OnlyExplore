import mongoose, { Schema, Document } from 'mongoose';

export interface IDestinationCache extends Document {
  destination: string;
  guideData: any;
  hotels: any[];
  restaurants: any[];
  activities: any[];
  weatherSnapshot: any;
  images: any;
  coordinates: { lat: number; lng: number };
  createdAt: Date;
}

const DestinationCacheSchema = new Schema<IDestinationCache>({
  destination: { type: String, required: true, unique: true },
  guideData: { type: Schema.Types.Mixed, required: true },
  hotels: [{ type: Schema.Types.Mixed }],
  restaurants: [{ type: Schema.Types.Mixed }],
  activities: [{ type: Schema.Types.Mixed }],
  weatherSnapshot: { type: Schema.Types.Mixed },
  images: { type: Schema.Types.Mixed },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

// Index to support TTL (expires in 30 days)
DestinationCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
DestinationCacheSchema.index({ destination: 1 });

export default mongoose.models.DestinationCache ||
  mongoose.model<IDestinationCache>('DestinationCache', DestinationCacheSchema);
