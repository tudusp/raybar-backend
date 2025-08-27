import Notification, { INotification } from '../models/Notification';
import User from '../models/User';
import Match from '../models/Match';

export interface CreateNotificationData {
  recipientId: string;
  type: 'message' | 'match' | 'like' | 'super-like' | 'profile_view' | 'system';
  title: string;
  message: string;
  data?: {
    matchId?: string;
    userId?: string;
    messageId?: string;
  };
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(data: CreateNotificationData): Promise<INotification> {
    try {
      const notification = new Notification({
        recipient: data.recipientId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create a match notification
   */
  static async createMatchNotification(matchId: string, user1Id: string, user2Id: string): Promise<void> {
    try {
      // Get user details for the notification
      const [user1, user2] = await Promise.all([
        User.findById(user1Id).select('profile.firstName profile.lastName'),
        User.findById(user2Id).select('profile.firstName profile.lastName')
      ]);

      if (!user1 || !user2) {
        console.error('Users not found for match notification');
        return;
      }

      // Create notification for user1
      await this.createNotification({
        recipientId: user1Id,
        type: 'match',
        title: 'New Match!',
        message: `You matched with ${user2.profile.firstName} ${user2.profile.lastName}!`,
        data: { matchId, userId: user2Id }
      });

      // Create notification for user2
      await this.createNotification({
        recipientId: user2Id,
        type: 'match',
        title: 'New Match!',
        message: `You matched with ${user1.profile.firstName} ${user1.profile.lastName}!`,
        data: { matchId, userId: user1Id }
      });
    } catch (error) {
      console.error('Error creating match notification:', error);
    }
  }

  /**
   * Create a like notification
   */
  static async createLikeNotification(likerId: string, likedId: string, isSuperLike: boolean = false): Promise<void> {
    try {
      const liker = await User.findById(likerId).select('profile.firstName profile.lastName');
      if (!liker) {
        console.error('Liker not found for like notification');
        return;
      }

      const type = isSuperLike ? 'super-like' : 'like';
      const title = isSuperLike ? 'Super Like!' : 'New Like';
      const message = isSuperLike 
        ? `${liker.profile.firstName} super liked your profile!`
        : `${liker.profile.firstName} liked your profile!`;

      await this.createNotification({
        recipientId: likedId,
        type,
        title,
        message,
        data: { userId: likerId }
      });
    } catch (error) {
      console.error('Error creating like notification:', error);
    }
  }

  /**
   * Create a message notification
   */
  static async createMessageNotification(senderId: string, recipientId: string, matchId: string, messageContent: string): Promise<void> {
    try {
      const sender = await User.findById(senderId).select('profile.firstName profile.lastName');
      if (!sender) {
        console.error('Sender not found for message notification');
        return;
      }

      // Truncate message content for notification
      const truncatedMessage = messageContent.length > 50 
        ? messageContent.substring(0, 50) + '...' 
        : messageContent;

      await this.createNotification({
        recipientId,
        type: 'message',
        title: `New message from ${sender.profile.firstName}`,
        message: truncatedMessage,
        data: { matchId, userId: senderId }
      });
    } catch (error) {
      console.error('Error creating message notification:', error);
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string, limit: number = 50, skip: number = 0): Promise<INotification[]> {
    try {
      const notifications = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('data.userId', 'profile.firstName profile.lastName profile.photos')
        .populate('data.matchId');

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { read: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await Notification.updateMany(
        { recipient: userId, read: false },
        { read: true }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({ recipient: userId, read: false });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}
