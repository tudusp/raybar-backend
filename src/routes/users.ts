import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('age').optional().isInt({ min: 18, max: 100 }),
  body('bio').optional().isLength({ max: 500 }),
  body('interests').optional().isArray(),
  body('education').optional().trim(),
  body('occupation').optional().trim(),
  body('height').optional().isInt({ min: 120, max: 250 }),
  body('bodyType').optional().isIn(['slim', 'average', 'athletic', 'curvy', 'heavy']),
  body('smoking').optional().isIn(['never', 'sometimes', 'regularly']),
  body('drinking').optional().isIn(['never', 'sometimes', 'regularly']),
  body('religion').optional().trim(),
  body('relationshipGoals').optional().isIn(['long-term', 'marriage', 'short-term', 'friendship', 'networking', 'serious']),
  body('relationshipStatus').optional().isIn(['single', 'married', 'divorced', 'widow'])
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profile fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        (user.profile as any)[key] = updates[key];
      }
    });

    await user.save();

    const updatedUser = await User.findById(req.userId).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', authenticate, [
  body('ageRange.min').optional().isInt({ min: 18 }),
  body('ageRange.max').optional().isInt({ max: 100 }),
  body('maxDistance').optional().isInt({ min: 1, max: 500 }),
  body('interestedIn').optional().isIn(['male', 'female', 'both'])
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update preferences
    if (req.body.ageRange) {
      user.preferences.ageRange = { ...user.preferences.ageRange, ...req.body.ageRange };
    }
    if (req.body.maxDistance) {
      user.preferences.maxDistance = req.body.maxDistance;
    }
    if (req.body.interestedIn) {
      user.preferences.interestedIn = req.body.interestedIn;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/photos
// @desc    Add user photo
// @access  Private
router.post('/photos', authenticate, [
  body('photoUrl').isURL()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.profile.photos.length >= 6) {
      return res.status(400).json({ message: 'Maximum 6 photos allowed' });
    }

    user.profile.photos.push(req.body.photoUrl);
    await user.save();

    res.json({
      success: true,
      message: 'Photo added successfully',
      photos: user.profile.photos
    });
  } catch (error) {
    console.error('Add photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/photos/:index
// @desc    Remove user photo
// @access  Private
router.delete('/photos/:index', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const photoIndex = parseInt(req.params.index);
    if (photoIndex < 0 || photoIndex >= user.profile.photos.length) {
      return res.status(400).json({ message: 'Invalid photo index' });
    }

    user.profile.photos.splice(photoIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: 'Photo removed successfully',
      photos: user.profile.photos
    });
  } catch (error) {
    console.error('Remove photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/location
// @desc    Update user location
// @access  Private
router.put('/location', authenticate, [
  body('city').trim().isLength({ min: 1 }),
  body('state').optional().trim(),
  body('country').trim().isLength({ min: 1 }),
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lng').isFloat({ min: -180, max: 180 })
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { city, state, country, lat, lng } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        'profile.location': {
          city,
          state: state || '',
          country,
          coordinates: { lat, lng }
        }
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Location updated successfully',
      location: user?.profile.location
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { limit = 50, skip = 0 } = req.query;
    const notifications = await NotificationService.getUserNotifications(
      req.userId!, 
      parseInt(limit as string), 
      parseInt(skip as string)
    );

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/notifications/:notificationId/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:notificationId/read', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const { notificationId } = req.params;
    
    await NotificationService.markAsRead(notificationId, req.userId!);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    await NotificationService.markAllAsRead(req.userId!);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:userId
// @desc    Get public user profile
// @access  Private
router.get('/:userId', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const { userId } = req.params;
    
    // Don't allow viewing your own profile through this endpoint
    if (userId === req.userId) {
      return res.status(400).json({ message: 'Use /profile endpoint for your own profile' });
    }

    const user = await User.findById(userId).select('-password -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate distance if current user has location
    const currentUser = await User.findById(req.userId);
    let distance = null;
    
    if (currentUser?.profile.location.coordinates && user.profile.location.coordinates) {
      const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      const currentCoords = currentUser.profile.location.coordinates;
      const userCoords = user.profile.location.coordinates;
      distance = Math.round(calculateDistance(
        currentCoords.lat,
        currentCoords.lng,
        userCoords.lat,
        userCoords.lng
      ));
    }

    const userWithDistance = {
      ...user.toObject(),
      distance
    };

    res.json({
      success: true,
      user: userWithDistance
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// @route   GET /api/users/suggestions
// @desc    Get user suggestions (potential matches)
// @access  Private
router.get('/suggestions', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get potential matches based on user preferences
    const suggestions = await User.find({
      _id: { 
        $ne: req.userId,
        $nin: [...user.likes, ...user.dislikes, ...user.blockedUsers]
      },
      'profile.gender': user.profile.interestedIn === 'both' ? { $in: ['male', 'female'] } : user.profile.interestedIn,
      'profile.interestedIn': { 
        $in: [user.profile.gender, 'both']
      },
      'profile.age': {
        $gte: user.preferences.ageRange.min,
        $lte: user.preferences.ageRange.max
      }
    })
    .select('-password -email')
    .limit(10)
    .sort({ 'activity.lastActive': -1 });

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/block/:userId
// @desc    Block a user
// @access  Private
router.post('/block/:userId', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.userId) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    const userToBlock = await User.findById(userId);
    if (!userToBlock) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }

    // Add to blocked users if not already blocked
    const userIdObjectId = new mongoose.Types.ObjectId(userId);
    if (!currentUser.blockedUsers.includes(userIdObjectId)) {
      currentUser.blockedUsers.push(userIdObjectId);
      await currentUser.save();
    }

    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/block/:userId
// @desc    Unblock a user
// @access  Private
router.delete('/block/:userId', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const { userId } = req.params;
    
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }

    // Remove from blocked users
    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (id: mongoose.Types.ObjectId) => id.toString() !== userId
    );
    await currentUser.save();

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/blocked
// @desc    Get blocked users
// @access  Private
router.get('/blocked', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const currentUser = await User.findById(req.userId).populate('blockedUsers', '-password -email');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      blockedUsers: currentUser.blockedUsers
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/report
// @desc    Report a user
// @access  Private
router.post('/report', authenticate, [
  body('userId').isMongoId(),
  body('reason').trim().isLength({ min: 1 }),
  body('description').trim().isLength({ min: 10 })
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, reason, description } = req.body;
    
    if (userId === req.userId) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }

    const userToReport = await User.findById(userId);
    if (!userToReport) {
      return res.status(404).json({ message: 'User not found' });
    }

    // In a real app, you'd save this to a Report model
    // For now, just return success
    res.json({
      success: true,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/reports
// @desc    Get user reports (admin only)
// @access  Private
router.get('/reports', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    // In a real app, you'd check if the user is an admin
    // and fetch reports from a Report model
    const reports = [
      {
        _id: '1',
        reportedUser: {
          _id: 'user1',
          firstName: 'John',
          lastName: 'Doe'
        },
        reportedBy: {
          _id: 'user2',
          firstName: 'Jane',
          lastName: 'Smith'
        },
        reason: 'Inappropriate behavior',
        description: 'User was being inappropriate in chat',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
