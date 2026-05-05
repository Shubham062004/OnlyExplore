import mongoose, { Schema, Document } from 'mongoose';

export interface IDestinationImages extends Document {
  destination: string;
  heroImage: string;
  gallery: string[];
  lastFetched: Date;
}

const DestinationImagesSchema = new Schema<IDestinationImages>({
  destination: { type: String, required: true, unique: true },
  heroImage: { type: String, required: true },
  gallery: [{ type: String }],
  lastFetched: { type: Date, default: Date.now },
});

export default mongoose.models.DestinationImages ||
  mongoose.model<IDestinationImages>('DestinationImages', DestinationImagesSchema);
