const fs = require('fs');
const https = require('https');
const path = require('path');

const images = [
  { name: 'manali', url: 'https://images.unsplash.com/photo-1605649487212-47bd183c4f15?q=80&w=800&auto=format&fit=crop' },
  { name: 'shimla', url: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=800&auto=format&fit=crop' },
  { name: 'leh', url: 'https://images.unsplash.com/photo-1581793745862-99f50a0e1422?q=80&w=800&auto=format&fit=crop' },
  { name: 'munnar', url: 'https://images.unsplash.com/photo-1593693397690-362bb9a1153a?q=80&w=800&auto=format&fit=crop' },
  { name: 'gangtok', url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop' },
  { name: 'goa', url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop' },
  { name: 'andaman', url: 'https://images.unsplash.com/photo-1588602052445-5683446df912?q=80&w=800&auto=format&fit=crop' },
  { name: 'kochi', url: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=800&auto=format&fit=crop' },
  { name: 'pondicherry', url: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800&auto=format&fit=crop' },
  { name: 'varkala', url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800&auto=format&fit=crop' },
  { name: 'jaipur', url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=800&auto=format&fit=crop' },
  { name: 'udaipur', url: 'https://images.unsplash.com/photo-1615836245337-f589c198ecef?q=80&w=800&auto=format&fit=crop' },
  { name: 'varanasi', url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=800&auto=format&fit=crop' },
  { name: 'hampi', url: 'https://images.unsplash.com/photo-1600100397608-f010f41cb858?q=80&w=800&auto=format&fit=crop' },
  { name: 'lucknow', url: 'https://images.unsplash.com/photo-1587588354456-ae376af71a25?q=80&w=800&auto=format&fit=crop' },
  { name: 'mumbai', url: 'https://images.unsplash.com/photo-1522543558187-768b6df7c25c?q=80&w=800&auto=format&fit=crop' },
  { name: 'delhi', url: 'https://images.unsplash.com/photo-1587474260580-58955d14df9d?q=80&w=800&auto=format&fit=crop' },
  { name: 'bengaluru', url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=800&auto=format&fit=crop' },
  { name: 'hyderabad', url: 'https://images.unsplash.com/photo-1587474260580-58955d14df9d?q=80&w=800&auto=format&fit=crop' },
  { name: 'kolkata', url: 'https://images.unsplash.com/photo-1538925468504-22b62d887a02?q=80&w=800&auto=format&fit=crop' }
];

const destDir = path.join(__dirname, 'public', 'destinations');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

console.log('Downloading 20 destination images to public/destinations...');

images.forEach(img => {
  const filePath = path.join(destDir, `${img.name}.jpg`);
  https.get(img.url, (res) => {
    // Handle redirects (Unsplash URLs redirect from https://images.unsplash.com to another CDN node)
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      https.get(res.headers.location, (redirectRes) => {
        const fileStream = fs.createWriteStream(filePath);
        redirectRes.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Downloaded ${img.name}.jpg`);
        });
      });
    } else {
      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded ${img.name}.jpg`);
      });
    }
  }).on('error', (err) => {
    console.error(`Error downloading ${img.name}: `, err.message);
  });
});
