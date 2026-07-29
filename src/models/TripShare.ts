import mongoose, { Schema, Document } from "mongoose";

export interface ITripShare extends Document {
  tripId: mongoose.Types.ObjectId;
  sharedWithEmail?: string;
  role: "Owner" | "Editor" | "Viewer";
  token: string;
  expiresAt?: Date;
  createdAt: Date;
}

const TripShareSchema = new Schema<ITripShare>(
  {
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
    sharedWithEmail: { type: String, index: true },
    role: {
      type: String,
      enum: ["Owner", "Editor", "Viewer"],
      default: "Viewer",
    },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

TripShareSchema.index({ tripId: 1, sharedWithEmail: 1 });

export default mongoose.models.TripShare || mongoose.model<ITripShare>("TripShare", TripShareSchema);
