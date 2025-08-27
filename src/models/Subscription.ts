import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: 'free' | 'premium' | 'vip';
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  paymentMethod?: {
    type: 'card' | 'paypal';
    last4?: string;
    brand?: string;
  };
  paymentHistory: {
    amount: number;
    currency: string;
    date: Date;
    status: 'success' | 'failed' | 'pending' | 'refunded';
    transactionId?: string;
  }[];
  features: {
    unlimitedLikes: boolean;
    unlimitedSuperLikes: boolean;
    rewindLastSwipe: boolean;
    seeWhoLikedYou: boolean;
    priorityProfile: boolean;
    advancedFilters: boolean;
    readReceipts: boolean;
    incognitoMode: boolean;
    boostProfile: boolean;
    passport: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'premium', 'vip'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired', 'pending'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'paypal']
    },
    last4: String,
    brand: String
  },
  paymentHistory: [{
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending', 'refunded'],
      default: 'pending'
    },
    transactionId: String
  }],
  features: {
    unlimitedLikes: {
      type: Boolean,
      default: false
    },
    unlimitedSuperLikes: {
      type: Boolean,
      default: false
    },
    rewindLastSwipe: {
      type: Boolean,
      default: false
    },
    seeWhoLikedYou: {
      type: Boolean,
      default: false
    },
    priorityProfile: {
      type: Boolean,
      default: false
    },
    advancedFilters: {
      type: Boolean,
      default: false
    },
    readReceipts: {
      type: Boolean,
      default: false
    },
    incognitoMode: {
      type: Boolean,
      default: false
    },
    boostProfile: {
      type: Boolean,
      default: false
    },
    passport: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ plan: 1 });
SubscriptionSchema.index({ endDate: 1 });

// Virtual for checking if subscription is active
SubscriptionSchema.virtual('isActive').get(function() {
  if (this.status !== 'active') return false;
  if (!this.endDate) return true;
  return new Date() < this.endDate;
});

// Method to update features based on plan
SubscriptionSchema.methods.updateFeatures = function() {
  const planFeatures: Record<'free' | 'premium' | 'vip', any> = {
    free: {
      unlimitedLikes: false,
      unlimitedSuperLikes: false,
      rewindLastSwipe: false,
      seeWhoLikedYou: false,
      priorityProfile: false,
      advancedFilters: false,
      readReceipts: false,
      incognitoMode: false,
      boostProfile: false,
      passport: false
    },
    premium: {
      unlimitedLikes: true,
      unlimitedSuperLikes: true,
      rewindLastSwipe: true,
      seeWhoLikedYou: true,
      priorityProfile: true,
      advancedFilters: true,
      readReceipts: false,
      incognitoMode: false,
      boostProfile: false,
      passport: false
    },
    vip: {
      unlimitedLikes: true,
      unlimitedSuperLikes: true,
      rewindLastSwipe: true,
      seeWhoLikedYou: true,
      priorityProfile: true,
      advancedFilters: true,
      readReceipts: true,
      incognitoMode: true,
      boostProfile: true,
      passport: true
    }
  };

  this.features = planFeatures[this.plan as 'free' | 'premium' | 'vip'];
  return this.save();
};

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
