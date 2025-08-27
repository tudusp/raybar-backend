import express from 'express';
import { body, validationResult } from 'express-validator';
import Message from '../models/Message';
import Match from '../models/Match';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const router = express.Router();

// @route   GET /api/chat/matches/:matchId/messages
// @desc    Get messages for a match
// @access  Private
router.get('/matches/:matchId/messages', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const { matchId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    console.log('🔍 Fetching messages for match:', matchId);
    console.log('👤 Current user ID:', req.userId);

    // Verify user is part of this match
    const match = await Match.findById(matchId);
    if (!match) {
      console.log('❌ Match not found:', matchId);
      return res.status(404).json({ message: 'Match not found' });
    }

    console.log('✅ Match found:', {
      matchId: match._id,
      user1: match.user1.toString(),
      user2: match.user2.toString(),
      isActive: match.isActive
    });

    // Check if user is part of this match
    if (!req.userId) {
      console.log('❌ No userId in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const isUserInMatch = match.user1.toString() === req.userId.toString() || match.user2.toString() === req.userId.toString();
    
    console.log('🔍 Authorization check:', {
      userId: req.userId.toString(),
      userIdType: typeof req.userId.toString(),
      matchUser1: match.user1.toString(),
      matchUser1Type: typeof match.user1.toString(),
      matchUser2: match.user2.toString(),
      matchUser2Type: typeof match.user2.toString(),
      isUser1Match: match.user1.toString() === req.userId.toString(),
      isUser2Match: match.user2.toString() === req.userId.toString(),
      isUserInMatch: isUserInMatch
    });
    
    if (!isUserInMatch) {
      console.log('❌ User not authorized:', {
        userId: req.userId?.toString(),
        matchUser1: match.user1.toString(),
        matchUser2: match.user2.toString()
      });
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    console.log('✅ Authorization passed, fetching messages...');

    const messages = await Message.find({ 
      matchId,
      isDeleted: false
    })
    .populate('sender', 'profile.firstName profile.photos')
    .populate('receiver', 'profile.firstName profile.photos')
    .sort({ createdAt: -1 })
    .limit(Number(limit) * Number(page))
    .skip((Number(page) - 1) * Number(limit));

    console.log('📨 Messages found:', messages.length);
    console.log('📨 Messages:', messages.map(m => ({
      id: m._id,
      content: m.content,
      sender: m.sender,
      receiver: m.receiver,
      matchId: m.matchId
    })));

    // Mark messages as read
    await Message.updateMany({
      matchId,
      receiver: req.userId!,
      isRead: false
    }, {
      isRead: true,
      readAt: new Date()
    });

    const response = {
      success: true,
      messages: messages.reverse(), // Return in chronological order
      page: Number(page),
      limit: Number(limit)
    };

    console.log('📤 Sending response:', {
      success: response.success,
      messageCount: response.messages.length,
      page: response.page,
      limit: response.limit
    });

    res.json(response);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/matches/:matchId/messages
// @desc    Send a message
// @access  Private
router.post('/matches/:matchId/messages', authenticate, [
  body('content').trim().isLength({ min: 1, max: 1000 }),
  body('messageType').optional().isIn(['text', 'image', 'gif', 'emoji'])
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matchId } = req.params;
    const { content, messageType = 'text' } = req.body;

    // Verify match exists and user is part of it
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (!match.isActive) {
      return res.status(400).json({ message: 'Cannot send message to inactive match' });
    }

    if (match.user1.toString() !== req.userId && match.user2.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to send messages in this match' });
    }

    // Determine receiver
    const receiverId = match.user1.toString() === req.userId ? match.user2 : match.user1;

    // Create message
    const message = new Message({
      matchId,
      sender: req.userId,
      receiver: receiverId,
      content,
      messageType
    });

    await message.save();

    // Update match last message timestamp
    match.lastMessageAt = new Date();
    await match.save();

    // Populate sender info for response
    await message.populate('sender', 'profile.firstName profile.photos');

    // Create message notification
    await NotificationService.createMessageNotification(
      req.userId!,
      receiverId.toString(),
      matchId,
      content
    );

    res.status(201).json({
      success: true,
      message,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chat/messages/:messageId
// @desc    Edit a message
// @access  Private
router.put('/messages/:messageId', authenticate, [
  body('content').trim().isLength({ min: 1, max: 1000 })
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({ message: 'Can only edit your own messages' });
    }

    // Check if message is recent (allow editing within 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(400).json({ message: 'Cannot edit messages older than 15 minutes' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message updated successfully',
      updatedMessage: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/chat/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete('/messages/:messageId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({ message: 'Can only delete your own messages' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/conversations
// @desc    Get user's conversations (matches with recent messages)
// @access  Private
router.get('/conversations', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    console.log('🔍 Fetching conversations for user:', req.userId);
    
    const matches = await Match.find({
      $or: [{ user1: req.userId }, { user2: req.userId }],
      isActive: true
    }).populate('user1', 'profile.firstName profile.lastName profile.photos activity.isOnline activity.lastActive')
    .populate('user2', 'profile.firstName profile.lastName profile.photos activity.isOnline activity.lastActive')
    .sort({ lastMessageAt: -1, matchedAt: -1 });

    console.log('📋 Found matches:', matches.length);
    
    const conversations = await Promise.all(
      matches.map(async (match) => {
        console.log('🔍 Processing match:', match._id, 'with users:', match.user1._id, match.user2._id);
        
        // Get the other user (not the current user)
        console.log('🔍 Comparing user IDs:', {
          reqUserId: req.userId,
          reqUserIdType: typeof req.userId,
          reqUserIdString: req.userId?.toString() || 'undefined',
          matchUser1Id: match.user1._id.toString(),
          matchUser1IdType: typeof match.user1._id.toString(),
          matchUser2Id: match.user2._id.toString(),
          matchUser2IdType: typeof match.user2._id.toString(),
          user1Comparison: match.user1._id.toString() === req.userId?.toString(),
          user2Comparison: match.user2._id.toString() === req.userId?.toString()
        });
        
        const isUser1 = match.user1._id.toString() === req.userId?.toString();
        const otherUser = isUser1 ? match.user2 : match.user1;
        
        console.log('🔍 Conversation user mapping:', {
          matchId: match._id,
          currentUserId: req.userId,
          user1Id: match.user1._id.toString(),
          user2Id: match.user2._id.toString(),
          user1Name: (match.user1 as any).profile?.firstName || 'Unknown',
          user2Name: (match.user2 as any).profile?.firstName || 'Unknown',
          otherUserId: otherUser._id.toString(),
          otherUserName: (otherUser as any).profile?.firstName || 'Unknown',
          isUser1Match: isUser1,
          currentUserName: isUser1 ? (match.user1 as any).profile?.firstName : (match.user2 as any).profile?.firstName,
          matchUser1Id: match.user1._id.toString(),
          matchUser2Id: match.user2._id.toString(),
          currentUserIdType: typeof req.userId,
          user1IdType: typeof match.user1._id.toString(),
          user2IdType: typeof match.user2._id.toString()
        });
        
        // Get last message
        const lastMessage = await Message.findOne({
          matchId: match._id,
          isDeleted: false
        }).sort({ createdAt: -1 });

        // Get unread message count
        const unreadCount = await Message.countDocuments({
          matchId: match._id,
          receiver: req.userId,
          isRead: false,
          isDeleted: false
        });

        return {
          matchId: match._id?.toString() || '',
          user: otherUser,
          lastMessage,
          unreadCount,
          lastActivity: match.lastMessageAt || match.matchedAt
        };
      })
    );

    res.json({
      success: true,
      conversations,
      total: conversations.length
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.post('/messages/:messageId/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the receiver
    if (message.receiver.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/test
// @desc    Test endpoint to check if chat routes are working
// @access  Private
router.get('/test', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    console.log('🧪 Chat test endpoint hit by user:', req.userId);
    
    // Check if user exists
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has any matches
    const matches = await Match.find({
      $or: [{ user1: req.userId }, { user2: req.userId }],
      isActive: true
    });

    console.log('📋 User matches found:', matches.length);
    console.log('📋 Match IDs:', matches.map(m => m._id));

    res.json({
      success: true,
      message: 'Chat test successful',
      userId: req.userId,
      userName: user.profile.firstName,
      matchesCount: matches.length,
      matches: matches.map(m => ({
        id: m._id,
        user1: m.user1,
        user2: m.user2,
        isActive: m.isActive
      }))
    });
  } catch (error) {
    console.error('Chat test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
