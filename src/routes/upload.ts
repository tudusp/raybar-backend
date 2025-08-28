import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage (for Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'matchmaking',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!.secure_url);
        }
      }
    );

    stream.end(file.buffer);
  });
};

// Upload profile photo
router.post('/profile-photo', upload.single('photo'), async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Upload to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(req.file);

    // Add photo to user's photos array
    user.profile.photos.push(cloudinaryUrl);

    // If this is the first photo, make it the primary photo
    if (user.profile.photos.length === 1) {
      // Reorder to make the new photo first
      user.profile.photos = [cloudinaryUrl, ...user.profile.photos.filter(p => p !== cloudinaryUrl)];
    }

    await user.save();

    res.json({
      message: 'Photo uploaded successfully!',
      photoUrl: cloudinaryUrl,
      photos: user.profile.photos
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ message: 'Server error during upload.' });
  }
});

// Upload multiple photos
router.post('/photos', upload.array('photos', 6), async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const uploadedPhotos: string[] = [];

    // Process each uploaded file
    for (const file of req.files as any[]) {
      const cloudinaryUrl = await uploadToCloudinary(file);
      uploadedPhotos.push(cloudinaryUrl);
    }

    // Add new photos to user's photos array
    user.profile.photos = [...user.profile.photos, ...uploadedPhotos];

    // Limit to 6 photos maximum
    if (user.profile.photos.length > 6) {
      user.profile.photos = user.profile.photos.slice(0, 6);
    }

    await user.save();

    res.json({
      message: 'Photos uploaded successfully!',
      uploadedPhotos,
      photos: user.profile.photos
    });
  } catch (error) {
    console.error('Upload photos error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Delete a photo
router.delete('/photos/:photoIndex', async (req: AuthRequest, res: express.Response) => {
  try {
    const photoIndex = parseInt(req.params.photoIndex);
    
    if (isNaN(photoIndex) || photoIndex < 0) {
      return res.status(400).json({ message: 'Invalid photo index.' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (photoIndex >= user.profile.photos.length) {
      return res.status(400).json({ message: 'Photo index out of range.' });
    }

    // Get the photo URL to delete the file
    const photoUrl = user.profile.photos[photoIndex];
    const photoPath = path.join(__dirname, '../../', photoUrl);

    // Remove photo from array
    user.profile.photos.splice(photoIndex, 1);

    await user.save();

    // Delete file from filesystem
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    res.json({
      message: 'Photo deleted successfully!',
      photos: user.profile.photos
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Reorder photos
router.patch('/photos/reorder', async (req: AuthRequest, res: express.Response) => {
  try {
    const { photoOrder } = req.body;

    if (!Array.isArray(photoOrder)) {
      return res.status(400).json({ message: 'Photo order must be an array.' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Validate that all photos in the order exist in user's photos
    const userPhotoUrls = new Set(user.profile.photos);
    const isValidOrder = photoOrder.every(photoUrl => userPhotoUrls.has(photoUrl));

    if (!isValidOrder) {
      return res.status(400).json({ message: 'Invalid photo order.' });
    }

    // Update photo order
    user.profile.photos = photoOrder;
    await user.save();

    res.json({
      message: 'Photo order updated successfully!',
      photos: user.profile.photos
    });
  } catch (error) {
    console.error('Reorder photos error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get user's photos
router.get('/photos', async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.userId).select('profile.photos');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      photos: user.profile.photos
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

export default router;
