import mongoose from 'mongoose';

const DestinationGuideSchema = new mongoose.Schema({
  destination: {
    type: String,
    required: true,
    unique: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  images: {
    hero: String,
    places: [String],
    activities: [String],
    hotels: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // Optional: Cache expires in 30 days
  }
});


const DestinationGuide = mongoose.models.DestinationGuide || mongoose.model('DestinationGuide', DestinationGuideSchema);

export default DestinationGuide;
