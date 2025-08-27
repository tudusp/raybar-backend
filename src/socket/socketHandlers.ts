import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Message from '../models/Message';
import Match from '../models/Match';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware for socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`💬 User ${socket.userId} connected to chat`);

    // Update user online status
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, {
        'activity.isOnline': true,
        'activity.lastActive': new Date()
      });

      // Join user to their personal room
      socket.join(socket.userId);
    }

    // Handle joining a chat room (match)
    socket.on('join_match', async (matchId: string) => {
      try {
        // Verify user is part of this match
        const match = await Match.findById(matchId);
        if (match && (
          match.user1.toString() === socket.userId || 
          match.user2.toString() === socket.userId
        )) {
          socket.join(`match_${matchId}`);
          console.log(`📱 User ${socket.userId} joined match ${matchId}`);
        }
      } catch (error) {
        console.error('Join match error:', error);
      }
    });

    // Handle leaving a chat room
    socket.on('leave_match', (matchId: string) => {
      socket.leave(`match_${matchId}`);
      console.log(`📱 User ${socket.userId} left match ${matchId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data: {
      matchId: string;
      content: string;
      messageType?: string;
    }) => {
      try {
        const { matchId, content, messageType = 'text' } = data;

        // Verify match exists and user is part of it
        const match = await Match.findById(matchId);
        if (!match || !match.isActive) {
          socket.emit('error', { message: 'Invalid or inactive match' });
          return;
        }

        if (match.user1.toString() !== socket.userId && match.user2.toString() !== socket.userId) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Determine receiver
        const receiverId = match.user1.toString() === socket.userId ? match.user2 : match.user1;

        // Create message
        const message = new Message({
          matchId,
          sender: socket.userId,
          receiver: receiverId,
          content,
          messageType
        });

        await message.save();

        // Update match last message timestamp
        match.lastMessageAt = new Date();
        await match.save();

        // Populate sender info
        await message.populate('sender', 'profile.firstName profile.photos');

        // Emit to both users in the match
        io.to(`match_${matchId}`).emit('new_message', {
          message,
          matchId,
          timestamp: new Date()
        });

        // Send push notification to receiver if they're not in the chat room
        const receiverSockets = await io.in(receiverId.toString()).fetchSockets();
        const isReceiverInMatch = receiverSockets.some(s => s.rooms.has(`match_${matchId}`));
        
        if (!isReceiverInMatch) {
          io.to(receiverId.toString()).emit('message_notification', {
            matchId,
            message: {
              content: content.length > 50 ? content.substring(0, 50) + '...' : content,
              sender: message.sender,
              createdAt: message.createdAt
            }
          });
        }

        console.log(`💬 Message sent in match ${matchId} from ${socket.userId} to ${receiverId}`);
        
        // Dispatch custom event for frontend notification badge
        io.to(receiverId.toString()).emit('messageNotification', {
          type: 'message',
          matchId: matchId,
          senderId: socket.userId
        });
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { matchId: string }) => {
      socket.to(`match_${data.matchId}`).emit('user_typing', {
        userId: socket.userId,
        matchId: data.matchId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data: { matchId: string }) => {
      socket.to(`match_${data.matchId}`).emit('user_typing', {
        userId: socket.userId,
        matchId: data.matchId,
        isTyping: false
      });
    });

    // Handle message read receipts
    socket.on('mark_messages_read', async (data: { matchId: string }) => {
      try {
        const { matchId } = data;

        // Verify user is part of this match
        const match = await Match.findById(matchId);
        if (!match || (
          match.user1.toString() !== socket.userId && 
          match.user2.toString() !== socket.userId
        )) {
          return;
        }

        // Mark messages as read
        await Message.updateMany({
          matchId,
          receiver: socket.userId,
          isRead: false
        }, {
          isRead: true,
          readAt: new Date()
        });

        // Notify the other user that messages were read
        socket.to(`match_${matchId}`).emit('messages_read', {
          matchId,
          readerId: socket.userId,
          readAt: new Date()
        });
      } catch (error) {
        console.error('Mark messages read error:', error);
      }
    });

    // Handle new match notifications
    socket.on('new_match', (data: { userId: string, matchId: string }) => {
      io.to(data.userId).emit('match_notification', {
        message: 'You have a new match! 🎉',
        matchId: data.matchId,
        timestamp: new Date()
      });
      
      // Dispatch custom event for frontend notification badge
      io.to(data.userId.toString()).emit('matchNotification', {
        type: 'match',
        matchId: data.matchId
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`💬 User ${socket.userId} disconnected from chat`);
      
      // Update user offline status
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, {
          'activity.isOnline': false,
          'activity.lastActive': new Date()
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Helper function to send notification to a user
  const sendNotificationToUser = (userId: string, notification: any) => {
    io.to(userId).emit('notification', notification);
  };

  // Export helper function for use in other parts of the application
  return { sendNotificationToUser };
};
