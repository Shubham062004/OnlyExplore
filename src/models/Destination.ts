import mongoose, { Schema, Document } from 'mongoose';

export interface IDestination extends Document {
  name: string;
  slug: string;
  category: string;
  bestFor: string[];
}

const DestinationSchema = new Schema<IDestination>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  bestFor: [{ type: String }],
});

DestinationSchema.index({ category: 1 });

export default mongoose.models.Destination ||
  mongoose.model<IDestination>('Destination', DestinationSchema);
