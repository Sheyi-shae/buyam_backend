import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../libs/cloudinary.js';
import { Request } from 'express';

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'marketplace_uploads', // change folder name as needed
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 800, height: 800, crop: 'limit' }],
     public_id: (req: Request, file: any) => `${Date.now()}-${file.originalname.split('.')[0]}`,
  }as any,
});

// Initialize multer
const upload = multer({ storage });

export default upload;
