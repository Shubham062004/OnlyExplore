import mongoose, { Schema, Document } from 'mongoose';

export interface IGalleryItem {
  url: string;
  label: string;
}

export interface IDestinationImages extends Document {
  destination: string;
  heroImage: string;
  gallery: IGalleryItem[];
  lastFetched: Date;
}

const DestinationImagesSchema = new Schema<IDestinationImages>({
  destination: { type: String, required: true, unique: true },
  heroImage: { type: String, required: true },
  gallery: [{
    url: { type: String, required: true },
    label: { type: String, required: true }
  }],
  lastFetched: { type: Date, default: Date.now },
});

export default mongoose.models.DestinationImages ||
  mongoose.model<IDestinationImages>('DestinationImages', DestinationImagesSchema);
