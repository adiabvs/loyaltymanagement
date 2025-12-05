/**
 * Script to create proper placeholder assets for Expo build
 * Run: node create-assets.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, 'assets');

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a 1024x1024 PNG with dark blue background (#05060A)
const createImage = async (outputPath, size = 1024) => {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#05060A"/>
      <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.1}" fill="#38BDF8" text-anchor="middle" dominant-baseline="middle">Loyalty MVP</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .resize(size, size)
    .toFile(outputPath);
};

(async () => {
  try {
    // Create icon.png (1024x1024)
    await createImage(path.join(assetsDir, 'icon.png'), 1024);
    console.log('✅ Created icon.png (1024x1024)');

    // Create splash.png (2048x2048 for better quality)
    await createImage(path.join(assetsDir, 'splash.png'), 2048);
    console.log('✅ Created splash.png (2048x2048)');

    // Create adaptive-icon.png (1024x1024)
    await createImage(path.join(assetsDir, 'adaptive-icon.png'), 1024);
    console.log('✅ Created adaptive-icon.png (1024x1024)');

    console.log('\n📦 Assets created successfully!');
    console.log('⚠️  Note: These are placeholder images. Replace them with actual assets before production.');
  } catch (error) {
    console.error('❌ Error creating assets:', error);
    process.exit(1);
  }
})();

