const { v2: cloudinary } = require('cloudinary');
require('dotenv').config({ path: './apps/backend/.env' });

// Test Cloudinary configuration
console.log('🔧 Testing Cloudinary Configuration...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
console.log('API Key:', process.env.CLOUDINARY_API_KEY || 'NOT SET');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test upload with a simple image URL
async function testUpload() {
  try {
    console.log('\n📤 Testing Cloudinary upload...');
    
    // Test with a simple image from a public URL
    const result = await cloudinary.uploader.upload(
      'https://via.placeholder.com/300x200/blue/white?text=Test+Image',
      {
        public_id: 'test_upload_' + Date.now(),
        folder: 'street-performers/test',
      }
    );
    
    console.log('✅ Upload successful!');
    console.log('Public ID:', result.public_id);
    console.log('URL:', result.secure_url);
    console.log('Size:', result.bytes, 'bytes');
    
    // Clean up test image
    await cloudinary.uploader.destroy(result.public_id);
    console.log('🗑️  Test image cleaned up');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n💡 Solution: Check your CLOUDINARY_API_KEY in .env file');
    } else if (error.message.includes('Invalid cloud name')) {
      console.log('\n💡 Solution: Check your CLOUDINARY_CLOUD_NAME in .env file');
    } else if (error.message.includes('Invalid API secret')) {
      console.log('\n💡 Solution: Check your CLOUDINARY_API_SECRET in .env file');
    }
  }
}

// Check if all required env vars are set
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.log('\n❌ Cloudinary not configured properly');
  console.log('\n📋 To set up Cloudinary:');
  console.log('1. Go to https://cloudinary.com and sign up');
  console.log('2. Get your credentials from the dashboard');
  console.log('3. Create apps/backend/.env with:');
  console.log('   CLOUDINARY_CLOUD_NAME=your-cloud-name');
  console.log('   CLOUDINARY_API_KEY=your-api-key');
  console.log('   CLOUDINARY_API_SECRET=your-api-secret');
  console.log('4. Run this script again to test');
} else if (
  CLOUDINARY_CLOUD_NAME === 'your-cloudinary-cloud-name' ||
  CLOUDINARY_API_KEY === 'your-cloudinary-api-key' ||
  CLOUDINARY_API_SECRET === 'your-cloudinary-api-secret'
) {
  console.log('\n⚠️  Cloudinary has placeholder values');
  console.log('Please replace with your real Cloudinary credentials');
} else {
  // All looks good, test the upload
  testUpload();
}
