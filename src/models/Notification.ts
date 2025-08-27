import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: 'message' | 'match' | 'like' | 'super-like' | 'profile_view' | 'system';
  title: string;
  message: string;
  read: boolean;
  data?: {
    matchId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    messageId?: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['message', 'match', 'like', 'super-like', 'profile_view', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  data: {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'Match'
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, type: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
