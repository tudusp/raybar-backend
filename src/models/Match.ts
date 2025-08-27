import mongoose, { Document, Schema } from 'mongoose';

export interface IMatch extends Document {
  user1: mongoose.Types.ObjectId;
  user2: mongoose.Types.ObjectId;
  status: 'pending' | 'matched' | 'expired';
  matchedAt: Date;
  expiresAt: Date;
  lastMessageAt?: Date;
  isActive: boolean;
}

const MatchSchema: Schema = new Schema({
  user1: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'expired'],
    default: 'matched'
  },
  matchedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Matches expire after 30 days if no messages
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  lastMessageAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure no duplicate matches
MatchSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Index for querying user matches
MatchSchema.index({ user1: 1, isActive: 1 });
MatchSchema.index({ user2: 1, isActive: 1 });

export default mongoose.model<IMatch>('Match', MatchSchema);
