// Run with: node scripts/fixIndexes.mjs
// Drops stale indexes that conflict with the current schema
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env');

async function fixIndexes() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;

  const fixes = [
    // Stale location_1 index on destinationimages (renamed field from location → destination)
    { collection: 'destinationimages', index: 'location_1' },
  ];

  for (const { collection, index } of fixes) {
    try {
      const col = db.collection(collection);
      const indexes = await col.indexes();
      const exists = indexes.some((i) => i.name === index);

      if (exists) {
        await col.dropIndex(index);
        console.log(`✅ Dropped stale index "${index}" from "${collection}"`);
      } else {
        console.log(`⏭️  Index "${index}" not found in "${collection}" — already clean`);
      }
    } catch (err) {
      console.error(`❌ Failed for ${collection}.${index}:`, err.message);
    }
  }

  console.log('\n✅ Done.');
  await mongoose.disconnect();
}

fixIndexes().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
