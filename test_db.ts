import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from './src/lib/mongodb';
import DestinationCache from './src/models/DestinationCache';

async function main() {
  try {
    await connectDB();
    const docs = await DestinationCache.find({});
    console.log('Docs inside DestinationCache:', docs.map(d => ({
      destination: d.destination,
      id: d._id,
      hasGuide: !!d.guideData,
      heroTitle: d.guideData?.hero?.title
    })));
  } catch (e) {
    console.error('DB query failed:', e);
  }
}

main();
