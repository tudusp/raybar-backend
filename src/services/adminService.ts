import User from '../models/User';
import Admin from '../models/Admin';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NotificationService } from './notificationService';

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  bannedUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}

export interface UserSearchFilters {
  search?: string;
  plan?: 'free' | 'premium' | 'vip';
  status?: 'active' | 'banned' | 'unverified';
  gender?: 'male' | 'female' | 'other';
  ageRange?: { min: number; max: number };
  location?: string;
  isOnline?: boolean;
  hasPhotos?: boolean;
  isVerified?: boolean;
}

export interface PasswordResetRequest {
  email: string;
  resetToken: string;
  resetTokenExpiry: Date;
}

export class AdminService {
  /**
   * Get comprehensive user statistics
   */
  static async getUserStats(): Promise<UserStats> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      bannedUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      verifiedUsers,
      unverifiedUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 'activity.lastActive': { $gte: weekAgo } }),
      User.countDocuments({ 'subscription.plan': { $in: ['premium', 'vip'] } }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: monthAgo } }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isVerified: false })
    ]);

    return {
      totalUsers,
      activeUsers,
      premiumUsers,
      bannedUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      verifiedUsers,
      unverifiedUsers
    };
  }

  /**
   * Search and filter users with advanced options
   */
  static async searchUsers(filters: UserSearchFilters, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    let query: any = {};

    // Search filter
    if (filters.search) {
      query.$or = [
        { email: { $regex: filters.search, $options: 'i' } },
        { 'profile.firstName': { $regex: filters.search, $options: 'i' } },
        { 'profile.lastName': { $regex: filters.search, $options: 'i' } },
        { 'profile.bio': { $regex: filters.search, $options: 'i' } }
      ];
    }

    // Plan filter
    if (filters.plan) {
      query['subscription.plan'] = filters.plan;
    }

    // Status filter
    if (filters.status === 'banned') {
      query.isBanned = true;
    } else if (filters.status === 'active') {
      query.isBanned = false;
    } else if (filters.status === 'unverified') {
      query.isVerified = false;
    }

    // Gender filter
    if (filters.gender) {
      query['profile.gender'] = filters.gender;
    }

    // Age range filter
    if (filters.ageRange) {
      query['profile.age'] = {
        $gte: filters.ageRange.min,
        $lte: filters.ageRange.max
      };
    }

    // Location filter
    if (filters.location) {
      query['profile.location.city'] = { $regex: filters.location, $options: 'i' };
    }

    // Online status filter
    if (filters.isOnline !== undefined) {
      query['activity.isOnline'] = filters.isOnline;
    }

    // Has photos filter
    if (filters.hasPhotos) {
      query['profile.photos.0'] = { $exists: true };
    }

    // Verification filter
    if (filters.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('subscription'),
      User.countDocuments(query)
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get detailed user information
   */
  static async getUserDetails(userId: string) {
    const user = await User.findById(userId)
      .select('-password')
      .populate('subscription')
      .populate('matches', 'profile.firstName profile.lastName profile.photos');

    if (!user) {
      throw new Error('User not found');
    }

    // Get additional stats
    const [
      totalLikes,
      totalMatches,
      totalMessages,
      lastLogin
    ] = await Promise.all([
      User.countDocuments({ likes: userId }),
      user.matches.length,
      // Message count would require Message model
      0, // Placeholder
      user.activity.lastActive
    ]);

    return {
      user,
      stats: {
        totalLikes,
        totalMatches,
        totalMessages,
        lastLogin
      }
    };
  }

  /**
   * Ban or unban a user
   */
  static async banUser(userId: string, isBanned: boolean, reason?: string, duration?: number) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.isBanned = isBanned;
    
    if (isBanned) {
      user.banReason = reason || 'Violation of terms of service';
      user.banExpiry = duration 
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) // duration in days
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // default 30 days
    } else {
      user.banReason = undefined;
      user.banExpiry = undefined;
    }

    await user.save();

    // Send notification to user
    if (isBanned) {
      await NotificationService.createNotification({
        recipientId: userId,
        type: 'system',
        title: 'Account Suspended',
        message: `Your account has been suspended. Reason: ${user.banReason}. Expires: ${user.banExpiry?.toLocaleDateString()}`
      });
    } else {
      await NotificationService.createNotification({
        recipientId: userId,
        type: 'system',
        title: 'Account Restored',
        message: 'Your account has been restored. You can now use the platform again.'
      });
    }

    return user;
  }

  /**
   * Update user subscription
   */
  static async updateUserSubscription(userId: string, plan: 'free' | 'premium' | 'vip', status: 'active' | 'inactive' | 'cancelled' | 'expired', autoRenew?: boolean) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
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

    // Send notification
    await NotificationService.createNotification({
      recipientId: userId,
      type: 'system',
      title: 'Subscription Updated',
      message: `Your subscription has been updated to ${plan} plan. Status: ${status}`
    });

    return user;
  }

  /**
   * Reset user password (admin-initiated)
   */
  static async resetUserPassword(userId: string, newPassword: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear any existing reset tokens
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    // Send notification
    await NotificationService.createNotification({
      recipientId: userId,
      type: 'system',
      title: 'Password Reset',
      message: 'Your password has been reset by an administrator. Please contact support if you did not request this change.'
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Generate password reset token for user
   */
  static async generatePasswordResetToken(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    return {
      resetToken,
      resetTokenExpiry,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    };
  }

  /**
   * Update user profile (admin can update any field)
   */
  static async updateUserProfile(userId: string, updates: any) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update allowed fields
    const allowedFields = [
      'profile.firstName', 'profile.lastName', 'profile.bio', 'profile.age',
      'profile.gender', 'profile.location', 'profile.interests', 'profile.photos',
      'profile.relationshipStatus', 'profile.smoking', 'profile.drinking',
      'profile.relationshipGoals', 'preferences', 'isVerified', 'isBanned'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        // Handle nested object updates
        const keys = key.split('.');
        let current: any = user;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      }
    }

    await user.save();

    // Send notification
    await NotificationService.createNotification({
      recipientId: userId,
      type: 'system',
      title: 'Profile Updated',
      message: 'Your profile has been updated by an administrator.'
    });

    return user;
  }

  /**
   * Delete user account
   */
  static async deleteUser(userId: string, reason?: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete - mark as deleted instead of actually removing
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deleteReason = reason || 'Admin deletion';
    await user.save();

    // Send notification
    await NotificationService.createNotification({
      recipientId: userId,
      type: 'system',
      title: 'Account Deleted',
      message: 'Your account has been deleted by an administrator.'
    });

    return { message: 'User deleted successfully' };
  }

  /**
   * Get user activity logs
   */
  static async getUserActivity(userId: string, days: number = 30) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // This would typically come from an Activity model
    // For now, returning basic activity info
    const activity = {
      lastLogin: user.activity.lastActive,
      isOnline: user.activity.isOnline,
      loginCount: 0, // Would come from activity tracking
      profileViews: 0, // Would come from analytics
      messagesSent: 0, // Would come from Message model
      likesGiven: user.likes.length,
      matchesCount: user.matches.length
    };

    return activity;
  }

  /**
   * Get system analytics
   */
  static async getSystemAnalytics() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsers,
      premiumUsers,
      subscriptionRevenue
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: monthAgo } }),
      User.countDocuments({ 'activity.lastActive': { $gte: weekAgo } }),
      User.countDocuments({ 'subscription.plan': { $in: ['premium', 'vip'] } }),
      User.aggregate([
        {
          $match: {
            'subscription.plan': { $in: ['premium', 'vip'] },
            'subscription.status': 'active'
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
      ])
    ]);

    return {
      totalUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsers,
      premiumUsers,
      subscriptionRevenue: subscriptionRevenue[0]?.totalRevenue || 0,
      userGrowthRate: ((newUsersThisWeek / totalUsers) * 100).toFixed(2)
    };
  }
}
