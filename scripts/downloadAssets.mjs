// Run with: node scripts/downloadAssets.mjs
// Downloads 1 static destination image per location into public/assets/
// Uses Unsplash search API for correct, relevant images.

import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const ASSETS_DIR = join(__dirname, '../public/assets');
if (!existsSync(ASSETS_DIR)) {
  mkdirSync(ASSETS_DIR, { recursive: true });
  console.log('Created public/assets/');
}

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!ACCESS_KEY) {
  console.error('❌ UNSPLASH_ACCESS_KEY not found in .env');
  process.exit(1);
}

// Slug → precise search query for Unsplash
const destinations = {
  'manali':      'Manali Himachal Pradesh snow mountains India',
  'shimla':      'Shimla hill station Himachal Pradesh India',
  'leh-ladakh':  'Leh Ladakh monastery mountains India',
  'munnar':      'Munnar tea garden Kerala India',
  'gangtok':     'Gangtok Sikkim mountains India',
  'rishikesh':   'Rishikesh Ganga river ashram India',
  'darjeeling':  'Darjeeling tea gardens West Bengal India',
  'goa':         'Goa beach palm trees India',
  'andaman':     'Andaman Islands beach turquoise water India',
  'kochi':       'Kochi Kerala backwaters India',
  'pondicherry': 'Pondicherry French quarter beach India',
  'varkala':     'Varkala cliff beach Kerala India',
  'lakshadweep': 'Lakshadweep island coral reef India',
  'jaipur':      'Jaipur Hawa Mahal palace Rajasthan India',
  'udaipur':     'Udaipur lake palace Rajasthan India',
  'varanasi':    'Varanasi Ganges ghats India',
  'hampi':       'Hampi ruins Karnataka India',
  'lucknow':     'Lucknow Bara Imambara Uttar Pradesh India',
  'agra':        'Agra Taj Mahal India',
  'mysore':      'Mysore palace Karnataka India',
  'mumbai':      'Mumbai skyline Gateway of India',
  'new-delhi':   'New Delhi India Gate city',
  'bengaluru':   'Bengaluru Bangalore city India',
  'hyderabad':   'Hyderabad Charminar India',
  'kolkata':     'Kolkata Howrah Bridge India',
  'chennai':     'Chennai Marina Beach India',
  'default':     'India travel landscape',
};

async function fetchPhotoUrl(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${ACCESS_KEY}`;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const photo = data.results?.[0];
          resolve(photo?.urls?.regular || null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function downloadUrl(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadUrl(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      file.close();
      reject(err);
    });
  });
}

async function main() {
  console.log(`\nDownloading ${Object.keys(destinations).length} destination images via Unsplash search...\n`);

  for (const [slug, query] of Object.entries(destinations)) {
    const dest = join(ASSETS_DIR, `${slug}.jpg`);
    process.stdout.write(`  ${slug}.jpg … `);

    const photoUrl = await fetchPhotoUrl(query);
    if (!photoUrl) {
      console.log('❌ No result from Unsplash API');
      continue;
    }

    try {
      await downloadUrl(photoUrl, dest);
      console.log('✅');
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }

    // Respect Unsplash rate limit (50 req/hr demo key)
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('\nDone!');
}

main();
