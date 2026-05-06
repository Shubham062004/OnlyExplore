import mongoose, { Schema, Document } from 'mongoose';

export interface IPlaceImages extends Document {
  placeKey: string;       // e.g. "triveni-ghat-rishikesh"
  placeName: string;
  cityName: string;
  images: string[];
  lastFetched: Date;
}

const PlaceImagesSchema = new Schema<IPlaceImages>({
  placeKey: { type: String, required: true, unique: true, index: true },
  placeName: { type: String, required: true },
  cityName: { type: String, required: true },
  images: [{ type: String }],
  lastFetched: { type: Date, default: Date.now },
});

export default mongoose.models.PlaceImages ||
  mongoose.model<IPlaceImages>('PlaceImages', PlaceImagesSchema);
