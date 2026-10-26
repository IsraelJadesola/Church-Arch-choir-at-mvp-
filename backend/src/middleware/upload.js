import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'choir_app_materials',
        resource_type: 'auto', // Automatically detects image, video, or raw (pdf/audio) formats
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'mp3', 'wav', 'mp4']
    }
});

export const upload = multer({ storage: storage });