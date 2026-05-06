// Run with: node scripts/seedDestinations.mjs
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env');

const DestinationSchema = new mongoose.Schema({
  name: String,
  slug: String,
  category: String,
  bestFor: [String],
});

const Destination =
  mongoose.models.Destination || mongoose.model('Destination', DestinationSchema);

const destinations = [
  // Mountains & Hills
  { name: 'Manali', slug: 'manali', category: 'Mountains & Hills', bestFor: ['Snow', 'Trekking', 'Cool Weather', 'Adventure'] },
  { name: 'Shimla', slug: 'shimla', category: 'Mountains & Hills', bestFor: ['Snow', 'Heritage', 'Hill Station', 'Cool Weather'] },
  { name: 'Leh Ladakh', slug: 'leh-ladakh', category: 'Mountains & Hills', bestFor: ['Adventure', 'Biking', 'Monasteries', 'Snow'] },
  { name: 'Munnar', slug: 'munnar', category: 'Mountains & Hills', bestFor: ['Tea Gardens', 'Cool Weather', 'Nature', 'Trekking'] },
  { name: 'Gangtok', slug: 'gangtok', category: 'Mountains & Hills', bestFor: ['Snow', 'Monasteries', 'Nature', 'Cool Weather'] },
  { name: 'Rishikesh', slug: 'rishikesh', category: 'Mountains & Hills', bestFor: ['Yoga', 'Rafting', 'Adventure', 'Spiritual'] },
  { name: 'Darjeeling', slug: 'darjeeling', category: 'Mountains & Hills', bestFor: ['Tea', 'Trekking', 'Cool Weather', 'Views'] },

  // Beaches & Islands
  { name: 'Goa', slug: 'goa', category: 'Beaches & Islands', bestFor: ['Relaxation', 'Water Sports', 'Parties', 'Sunsets'] },
  { name: 'Andaman', slug: 'andaman', category: 'Beaches & Islands', bestFor: ['Beaches', 'Diving', 'Snorkeling', 'Nature'] },
  { name: 'Kochi', slug: 'kochi', category: 'Beaches & Islands', bestFor: ['Heritage', 'Backwaters', 'Seafood', 'Culture'] },
  { name: 'Pondicherry', slug: 'pondicherry', category: 'Beaches & Islands', bestFor: ['French Culture', 'Beaches', 'Yoga', 'Heritage'] },
  { name: 'Varkala', slug: 'varkala', category: 'Beaches & Islands', bestFor: ['Beaches', 'Ayurveda', 'Relaxation', 'Sunsets'] },
  { name: 'Lakshadweep', slug: 'lakshadweep', category: 'Beaches & Islands', bestFor: ['Beaches', 'Diving', 'Coral', 'Nature'] },

  // Heritage & Culture
  { name: 'Jaipur', slug: 'jaipur', category: 'Heritage & Culture', bestFor: ['History', 'Architecture', 'Shopping', 'Art'] },
  { name: 'Udaipur', slug: 'udaipur', category: 'Heritage & Culture', bestFor: ['Romance', 'Lakes', 'Palaces', 'History'] },
  { name: 'Varanasi', slug: 'varanasi', category: 'Heritage & Culture', bestFor: ['Spiritual', 'Ghats', 'Culture', 'History'] },
  { name: 'Hampi', slug: 'hampi', category: 'Heritage & Culture', bestFor: ['Ruins', 'History', 'Photography', 'Architecture'] },
  { name: 'Lucknow', slug: 'lucknow', category: 'Heritage & Culture', bestFor: ['Food', 'History', 'Nawabi Culture', 'Art'] },
  { name: 'Agra', slug: 'agra', category: 'Heritage & Culture', bestFor: ['Taj Mahal', 'Mughal History', 'Architecture', 'Art'] },
  { name: 'Mysore', slug: 'mysore', category: 'Heritage & Culture', bestFor: ['Palaces', 'Sandalwood', 'Culture', 'Festivals'] },

  // Urban Explorations
  { name: 'Mumbai', slug: 'mumbai', category: 'Urban Explorations', bestFor: ['Food', 'Nightlife', 'Bollywood', 'Shopping'] },
  { name: 'New Delhi', slug: 'new-delhi', category: 'Urban Explorations', bestFor: ['History', 'Food', 'Shopping', 'Culture'] },
  { name: 'Bengaluru', slug: 'bengaluru', category: 'Urban Explorations', bestFor: ['Tech', 'Nightlife', 'Food', 'Parks'] },
  { name: 'Hyderabad', slug: 'hyderabad', category: 'Urban Explorations', bestFor: ['Biryani', 'History', 'Tech', 'Food'] },
  { name: 'Kolkata', slug: 'kolkata', category: 'Urban Explorations', bestFor: ['Culture', 'Food', 'Heritage', 'Art'] },
  { name: 'Chennai', slug: 'chennai', category: 'Urban Explorations', bestFor: ['Culture', 'Beaches', 'Food', 'Temples'] },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  let created = 0;
  let skipped = 0;

  for (const dest of destinations) {
    const exists = await Destination.findOne({ slug: dest.slug });
    if (!exists) {
      await Destination.create(dest);
      created++;
      console.log(`  ✅ Created: ${dest.name}`);
    } else {
      skipped++;
      console.log(`  ⏭️  Exists:  ${dest.name}`);
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
