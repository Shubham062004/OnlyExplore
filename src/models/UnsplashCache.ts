import mongoose from 'mongoose';

const UnsplashCacheSchema = new mongoose.Schema({
  query: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.UnsplashCache || mongoose.model('UnsplashCache', UnsplashCacheSchema);
