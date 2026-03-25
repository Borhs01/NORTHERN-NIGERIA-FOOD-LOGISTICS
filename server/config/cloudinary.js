const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Check if credentials are valid (not demo/placeholder values)
const hasValidCredentials = 
  cloudName && 
  apiKey && 
  apiSecret &&
  cloudName !== 'democloud' &&
  cloudName !== 'demo' &&
  apiKey !== 'demokey123' &&
  apiKey !== 'demo' &&
  apiSecret !== 'demosecret123' &&
  apiSecret !== 'demo';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Use Cloudinary only if valid credentials are provided
let storage;
if (hasValidCredentials) {
  console.log('✅ Cloudinary configured - images will be uploaded to cloud');
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'northeats',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }],
    },
  });
} else {
  console.warn('⚠️  Cloudinary credentials not configured properly. Using local storage. Images will not persist across server restarts.');
  storage = multer.memoryStorage();
}

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = { cloudinary, upload };
