const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'noor-automobiles/cars';
    let resourceType = 'image';
    
    if (file.fieldname === 'parts') {
      folder = 'noor-automobiles/parts';
    }
    
    // Check if video
    if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    }
    
    return {
      folder: folder,
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov'],
      transformation: file.mimetype.startsWith('image/') 
        ? [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }]
        : undefined
    };
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

module.exports = { cloudinary, upload };
