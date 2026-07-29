import mongoose, { Schema, Document } from "mongoose";

export interface ITrip extends Document {
  userId?: mongoose.Types.ObjectId;
  guestId?: string;
  destination: string;
  title: string;
  status: "Draft" | "Planning" | "Upcoming" | "Completed" | "Cancelled";
  startDate?: Date;
  endDate?: Date;
  budget?: {
    total?: number;
    currency?: string;
    flights?: number;
    hotels?: number;
    food?: number;
    activities?: number;
    transport?: number;
  };
  itinerary: any[];
  hotels?: any[];
  attractions?: any[];
  restaurants?: any[];
  rentals?: any[];
  notes?: string;
  isArchived: boolean;
  shareKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    guestId: { type: String, index: true },
    destination: { type: String, required: true, index: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["Draft", "Planning", "Upcoming", "Completed", "Cancelled"],
      default: "Draft",
      index: true,
    },
    startDate: { type: Date },
    endDate: { type: Date },
    budget: {
      total: { type: Number },
      currency: { type: String, default: "INR" },
      flights: { type: Number },
      hotels: { type: Number },
      food: { type: Number },
      activities: { type: Number },
      transport: { type: Number },
    },
    itinerary: [{ type: Schema.Types.Mixed }],
    hotels: [{ type: Schema.Types.Mixed }],
    attractions: [{ type: Schema.Types.Mixed }],
    restaurants: [{ type: Schema.Types.Mixed }],
    rentals: [{ type: Schema.Types.Mixed }],
    notes: { type: String, default: "" },
    isArchived: { type: Boolean, default: false, index: true },
    shareKey: { type: String, unique: true, sparse: true, index: true },
  },
  { timestamps: true }
);

TripSchema.index({ userId: 1, status: 1 });
TripSchema.index({ createdAt: -1 });

export default mongoose.models.Trip || mongoose.model<ITrip>("Trip", TripSchema);
