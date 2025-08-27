import express from 'express';
import { body, query, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import User from '../models/User';
import Subscription from '../models/Subscription';
import { AuthRequest, AdminAuthRequest, adminAuth } from '../middleware/auth';
import { AdminService } from '../services/adminService';

const router = express.Router();



// Admin login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Invalid credentials or account inactive.' });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Update login stats
    admin.loginCount += 1;
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Test endpoint to check users in database
router.get('/test-users', adminAuth, async (req: AdminAuthRequest, res: express.Response) => {
  try {
    console.log('🔍 Testing users in database...');
    
    const totalUsers = await User.countDocuments();
    console.log('🔍 Total users in database:', totalUsers);
    
    const sampleUsers = await User.find().select('email profile.firstName profile.lastName createdAt').limit(5);
    console.log('🔍 Sample users:', sampleUsers);
    
    res.json({
      totalUsers,
      sampleUsers,
      message: 'Database test completed'
    });
  } catch (error) {
    console.error('❌ Test users error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Test endpoint to create sample users
router.post('/create-test-users', adminAuth, async (req: AdminAuthRequest, res: express.Response) => {
  try {
    console.log('🔧 Creating test users via API...');
    
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return res.json({ 
        message: `${existingUsers} users already exist in database`,
        totalUsers: existingUsers
      });
    }
    
    const testUsers = [
      {
        email: 'john.doe@example.com',
        password: 'password123',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          age: 28,
          gender: 'male',
          interestedIn: 'female',
          bio: 'I love hiking and coffee!',
          photos: ['https://via.placeholder.com/300x400'],
          location: {
            city: 'New York',
            state: 'NY',
            country: 'USA',
            coordinates: { lat: 40.7128, lng: -74.0060 }
          },
          interests: ['hiking', 'coffee', 'travel'],
          education: 'Bachelor\'s Degree',
          occupation: 'Software Engineer',
          height: 180,
          bodyType: 'athletic',
          smoking: 'never',
          drinking: 'sometimes',
          religion: 'Not specified',
          relationshipStatus: 'single',
          relationshipGoals: 'long-term'
        },
        preferences: {
          ageRange: { min: 25, max: 35 },
          maxDistance: 50,
          interestedIn: 'female'
        },
        activity: {
          lastActive: new Date(),
          isOnline: true
        },
        subscription: {
          plan: 'free',
          status: 'active',
          startDate: new Date(),
          autoRenew: false
        },
        isVerified: true,
        isBanned: false
      },
      {
        email: 'jane.smith@example.com',
        password: 'password123',
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
          age: 26,
          gender: 'female',
          interestedIn: 'male',
          bio: 'Passionate about art and music!',
          photos: ['https://via.placeholder.com/300x400'],
          location: {
            city: 'Los Angeles',
            state: 'CA',
            country: 'USA',
            coordinates: { lat: 34.0522, lng: -118.2437 }
          },
          interests: ['art', 'music', 'yoga'],
          education: 'Master\'s Degree',
          occupation: 'Graphic Designer',
          height: 165,
          bodyType: 'average',
          smoking: 'never',
          drinking: 'sometimes',
          religion: 'Not specified',
          relationshipStatus: 'single',
          relationshipGoals: 'marriage'
        },
        preferences: {
          ageRange: { min: 24, max: 32 },
          maxDistance: 30,
          interestedIn: 'male'
        },
        activity: {
          lastActive: new Date(),
          isOnline: false
        },
        subscription: {
          plan: 'premium',
          status: 'active',
          startDate: new Date(),
          autoRenew: true
        },
        isVerified: true,
        isBanned: false
      },
      {
        email: 'mike.wilson@example.com',
        password: 'password123',
        profile: {
          firstName: 'Mike',
          lastName: 'Wilson',
          age: 30,
          gender: 'male',
          interestedIn: 'female',
          bio: 'Fitness enthusiast and food lover!',
          photos: ['https://via.placeholder.com/300x400'],
          location: {
            city: 'Chicago',
            state: 'IL',
            country: 'USA',
            coordinates: { lat: 41.8781, lng: -87.6298 }
          },
          interests: ['fitness', 'cooking', 'movies'],
          education: 'Bachelor\'s Degree',
          occupation: 'Personal Trainer',
          height: 185,
          bodyType: 'athletic',
          smoking: 'never',
          drinking: 'sometimes',
          religion: 'Not specified',
          relationshipStatus: 'single',
          relationshipGoals: 'serious'
        },
        preferences: {
          ageRange: { min: 25, max: 35 },
          maxDistance: 40,
          interestedIn: 'female'
        },
        activity: {
          lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          isOnline: false
        },
        subscription: {
          plan: 'vip',
          status: 'active',
          startDate: new Date(),
          autoRenew: true
        },
        isVerified: true,
        isBanned: false
      }
    ];
    
    const createdUsers = [];
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user.email);
      console.log(`✅ Created user: ${userData.email}`);
    }
    
    console.log('🎉 Test users created successfully!');
    
    res.json({ 
      message: 'Test users created successfully!',
      createdUsers,
      totalUsers: await User.countDocuments()
    });
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get enhanced admin dashboard stats
router.get('/dashboard', adminAuth, async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const [userStats, systemAnalytics] = await Promise.all([
      AdminService.getUserStats(),
      AdminService.getSystemAnalytics()
    ]);

    res.json({
      userStats,
      systemAnalytics
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get all users with pagination and filters
router.get('/users', adminAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('plan').optional().isIn(['free', 'premium', 'vip']),
  query('status').optional().isIn(['active', 'banned']),
  query('sortBy').optional().isIn(['createdAt', 'lastActive', 'email']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    let filter: any = {};
    
    if (req.query.search) {
      filter.$or = [
        { email: { $regex: req.query.search, $options: 'i' } },
        { 'profile.firstName': { $regex: req.query.search, $options: 'i' } },
        { 'profile.lastName': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.plan) {
      filter['subscription.plan'] = req.query.plan;
    }

    if (req.query.status === 'banned') {
      filter.isBanned = true;
    } else if (req.query.status === 'active') {
      filter.isBanned = false;
    }

    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';
    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('subscription');

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Enhanced user search with advanced filters (MUST come before /users/:userId)
router.get('/users/search', adminAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('plan').optional().isIn(['free', 'premium', 'vip']),
  query('status').optional().isIn(['active', 'banned', 'unverified']),
  query('gender').optional().isIn(['male', 'female', 'other']),
  query('ageMin').optional().isInt({ min: 18, max: 100 }),
  query('ageMax').optional().isInt({ min: 18, max: 100 }),
  query('location').optional().trim(),
  query('isOnline').optional().isBoolean(),
  query('hasPhotos').optional().isBoolean(),
  query('isVerified').optional().isBoolean()
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    console.log('🔍 Admin user search request:', req.query);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const filters: any = {};
    
    if (req.query.search) filters.search = req.query.search;
    if (req.query.plan) filters.plan = req.query.plan;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.gender) filters.gender = req.query.gender;
    if (req.query.location) filters.location = req.query.location;
    if (req.query.isOnline !== undefined) filters.isOnline = req.query.isOnline === 'true';
    if (req.query.hasPhotos !== undefined) filters.hasPhotos = req.query.hasPhotos === 'true';
    if (req.query.isVerified !== undefined) filters.isVerified = req.query.isVerified === 'true';
    
    if (req.query.ageMin || req.query.ageMax) {
      filters.ageRange = {
        min: parseInt(req.query.ageMin as string) || 18,
        max: parseInt(req.query.ageMax as string) || 100
      };
    }

    console.log('🔍 Filters applied:', filters);
    
    const result = await AdminService.searchUsers(filters, page, limit);
    
    console.log('🔍 Search result:', {
      usersCount: result.users.length,
      total: result.pagination.total,
      page: result.pagination.page,
      pages: result.pagination.pages
    });
    
    res.json(result);
  } catch (error) {
    console.error('❌ User search error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get user details
router.get('/users/:userId', adminAuth, async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('subscription');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Ban/Unban user
router.patch('/users/:userId/ban', adminAuth, [
  body('isBanned').isBoolean(),
  body('reason').optional().trim()
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isBanned, reason } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.isBanned = isBanned;
    if (isBanned) {
      user.banReason = reason;
      user.banExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    } else {
      user.banReason = undefined;
      user.banExpiry = undefined;
    }

    await user.save();

    res.json({ message: `User ${isBanned ? 'banned' : 'unbanned'} successfully.`, user });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update user subscription
router.patch('/users/:userId/subscription', adminAuth, [
  body('plan').isIn(['free', 'premium', 'vip']),
  body('status').isIn(['active', 'inactive', 'cancelled', 'expired']),
  body('autoRenew').optional().isBoolean()
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { plan, status, autoRenew } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.subscription.plan = plan;
    user.subscription.status = status;
    if (autoRenew !== undefined) {
      user.subscription.autoRenew = autoRenew;
    }

    // Set end date for non-free plans
    if (plan !== 'free') {
      user.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    } else {
      user.subscription.endDate = undefined;
    }

    await user.save();

    res.json({ message: 'Subscription updated successfully.', user });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get subscription analytics
router.get('/subscriptions/analytics', adminAuth, async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const subscriptionStats = await User.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $in: ['$subscription.plan', ['premium', 'vip']] },
                { $cond: [{ $eq: ['$subscription.plan', 'premium'] }, 9.99, 19.99] },
                0
              ]
            }
          }
        }
      }
    ]);

    const monthlyRevenue = await User.aggregate([
      {
        $match: {
          'subscription.plan': { $in: ['premium', 'vip'] },
          'subscription.startDate': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$subscription.plan', 'premium'] },
                9.99,
                19.99
              ]
            }
          }
        }
      }
    ]);

    res.json({
      subscriptionStats,
      monthlyRevenue: monthlyRevenue[0]?.totalRevenue || 0
    });
  } catch (error) {
    console.error('Subscription analytics error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get system reports
router.get('/reports', adminAuth, async (req: AdminAuthRequest, res: express.Response) => {
  try {
    // This would typically come from a Reports model
    // For now, returning mock data
    const reports = [
      {
        id: '1',
        reporterId: 'user1',
        reportedUserId: 'user2',
        reason: 'Inappropriate content',
        status: 'pending',
        createdAt: new Date()
      }
    ];

    res.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});



// Get detailed user information
router.get('/users/:userId/details', adminAuth, async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const result = await AdminService.getUserDetails(req.params.userId);
    res.json(result);
  } catch (error) {
    console.error('Get user details error:', error);
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ message: 'User not found.' });
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// Enhanced ban/unban user with duration
router.patch('/users/:userId/ban', adminAuth, [
  body('isBanned').isBoolean(),
  body('reason').optional().trim(),
  body('duration').optional().isInt({ min: 1, max: 365 }) // days
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isBanned, reason, duration } = req.body;
    const user = await AdminService.banUser(req.params.userId, isBanned, reason, duration);

    res.json({ 
      message: `User ${isBanned ? 'banned' : 'unbanned'} successfully.`, 
      user 
    });
  } catch (error) {
    console.error('Ban user error:', error);
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ message: 'User not found.' });
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// Enhanced subscription management
router.patch('/users/:userId/subscription', adminAuth, [
  body('plan').isIn(['free', 'premium', 'vip']),
  body('status').isIn(['active', 'inactive', 'cancelled', 'expired']),
  body('autoRenew').optional().isBoolean()
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { plan, status, autoRenew } = req.body;
    const user = await AdminService.updateUserSubscription(req.params.userId, plan, status, autoRenew);

    res.json({ message: 'Subscription updated successfully.', user });
  } catch (error) {
    console.error('Update subscription error:', error);
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ message: 'User not found.' });
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// Reset user password (admin-initiated)
router.post('/users/:userId/reset-password', adminAuth, [
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword } = req.body;
    const result = await AdminService.resetUserPassword(req.params.userId, newPassword);

    res.json(result);
  } catch (error) {
    console.error('Reset password error:', error);
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ message: 'User not found.' });
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// Generate password reset token for user
router.post('/users/:userId/generate-reset-token', adminAuth, async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const result = await AdminService.generatePasswordResetToken(req.params.userId);
    res.json(result);
  } catch (error) {
    console.error('Generate reset token error:', error);
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ message: 'User not found.' });
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// Update user profile (admin can update any field)
router.patch('/users/:userId/profile', adminAuth, [
  body('updates').isObject().withMessage('Updates must be an object')
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { updates } = req.body;
    const user = await AdminService.updateUserProfile(req.params.userId, updates);

    res.json({ message: 'Profile updated successfully.', user });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ message: 'User not found.' });
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// Delete user account (soft delete)
router.delete('/users/:userId', adminAuth, [
  body('reason').optional().trim()
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const { reason } = req.body;
    const result = await AdminService.deleteUser(req.params.userId, reason);

    res.json(result);
  } catch (error) {
    console.error('Delete user error:', error);
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ message: 'User not found.' });
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// Get user activity logs
router.get('/users/:userId/activity', adminAuth, [
  query('days').optional().isInt({ min: 1, max: 365 })
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const days = parseInt(req.query.days as string) || 30;
    const activity = await AdminService.getUserActivity(req.params.userId, days);

    res.json({ activity });
  } catch (error) {
    console.error('Get user activity error:', error);
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ message: 'User not found.' });
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// Bulk operations
router.post('/users/bulk-action', adminAuth, [
  body('userIds').isArray({ min: 1 }).withMessage('User IDs must be an array'),
  body('action').isIn(['ban', 'unban', 'delete', 'verify', 'unverify']).withMessage('Invalid action'),
  body('reason').optional().trim()
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userIds, action, reason } = req.body;
    const results = [];

    for (const userId of userIds) {
      try {
        switch (action) {
          case 'ban':
            await AdminService.banUser(userId, true, reason);
            results.push({ userId, success: true, message: 'User banned' });
            break;
          case 'unban':
            await AdminService.banUser(userId, false);
            results.push({ userId, success: true, message: 'User unbanned' });
            break;
          case 'delete':
            await AdminService.deleteUser(userId, reason);
            results.push({ userId, success: true, message: 'User deleted' });
            break;
          case 'verify':
            await AdminService.updateUserProfile(userId, { isVerified: true });
            results.push({ userId, success: true, message: 'User verified' });
            break;
          case 'unverify':
            await AdminService.updateUserProfile(userId, { isVerified: false });
            results.push({ userId, success: true, message: 'User unverified' });
            break;
        }
      } catch (error) {
        results.push({ 
          userId, 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    res.json({ 
      message: `Bulk action '${action}' completed`, 
      results,
      summary: {
        total: userIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Debug endpoint to check users directly
router.get('/debug-users', adminAuth, async (req: AdminAuthRequest, res: express.Response) => {
  try {
    console.log('🔍 Debug: Checking users directly...');
    
    const totalUsers = await User.countDocuments();
    const allUsers = await User.find().select('email profile.firstName profile.lastName createdAt').limit(10);
    
    console.log('🔍 Debug: Total users in DB:', totalUsers);
    console.log('🔍 Debug: Sample users:', allUsers);
    
    res.json({
      totalUsers,
      sampleUsers: allUsers,
      message: 'Debug users check'
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

export default router;
