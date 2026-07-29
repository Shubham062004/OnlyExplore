import mongoose, { Schema, Document } from "mongoose";

export interface IFavorite extends Document {
  userId?: mongoose.Types.ObjectId;
  guestId?: string;
  itemType: "hotel" | "restaurant" | "attraction" | "experience" | "rental";
  itemId: string;
  name: string;
  destination: string;
  metadata: {
    rating?: number;
    image?: string;
    price?: string;
    tags?: string[];
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    guestId: { type: String, index: true },
    itemType: {
      type: String,
      enum: ["hotel", "restaurant", "attraction", "experience", "rental"],
      required: true,
      index: true,
    },
    itemId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    destination: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

FavoriteSchema.index({ userId: 1, itemId: 1 }, { unique: true, sparse: true });
FavoriteSchema.index({ guestId: 1, itemId: 1 }, { unique: true, sparse: true });

export default mongoose.models.Favorite || mongoose.model<IFavorite>("Favorite", FavoriteSchema);
