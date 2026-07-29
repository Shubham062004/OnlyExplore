import mongoose, { Schema, Document } from "mongoose";

export interface ISavedPlace extends Document {
  userId?: mongoose.Types.ObjectId;
  guestId?: string;
  placeId: string;
  name: string;
  category: "hotel" | "restaurant" | "attraction" | "experience" | "rental" | "medical" | "emergency";
  destination: string;
  details: {
    image?: string;
    rating?: number;
    price?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
    duration?: string;
    bestTime?: string;
    tags?: string[];
  };
  createdAt: Date;
}

const SavedPlaceSchema = new Schema<ISavedPlace>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    guestId: { type: String, index: true },
    placeId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["hotel", "restaurant", "attraction", "experience", "rental", "medical", "emergency"],
      required: true,
      index: true,
    },
    destination: { type: String, required: true, index: true },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

SavedPlaceSchema.index({ userId: 1, placeId: 1 }, { unique: true, sparse: true });
SavedPlaceSchema.index({ guestId: 1, placeId: 1 }, { unique: true, sparse: true });

export default mongoose.models.SavedPlace || mongoose.model<ISavedPlace>("SavedPlace", SavedPlaceSchema);
