import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    interestedIn: 'male' | 'female' | 'both';
    bio: string;
    photos: string[];
    location: {
      city: string;
      state: string;
      country: string;
      coordinates: {
        lat: number;
        lng: number;
      };
    };
    interests: string[];
    education: string;
    occupation: string;
    height: number; // in cm
    bodyType: string;
    smoking: 'never' | 'sometimes' | 'regularly';
    drinking: 'never' | 'sometimes' | 'regularly';
    religion: string;
    relationshipStatus: 'single' | 'married' | 'divorced' | 'widow';
    relationshipGoals: 'long-term' | 'marriage' | 'short-term' | 'friendship' | 'networking' | 'serious';
  };
  preferences: {
    ageRange: {
      min: number;
      max: number;
    };
    maxDistance: number; // in km
    interestedIn: 'male' | 'female' | 'both';
  };
  activity: {
    lastActive: Date;
    isOnline: boolean;
  };
  matches: mongoose.Types.ObjectId[];
  likes: mongoose.Types.ObjectId[];
  dislikes: mongoose.Types.ObjectId[];
  superLikes: mongoose.Types.ObjectId[];
  blockedUsers: mongoose.Types.ObjectId[];
  subscription: {
    plan: 'free' | 'premium' | 'vip';
    status: 'active' | 'inactive' | 'cancelled' | 'expired';
    startDate: Date;
    endDate?: Date;
    autoRenew: boolean;
    paymentMethod?: {
      type: 'card' | 'paypal';
      last4?: string;
      brand?: string;
    };
  };
  isVerified: boolean;
  isBanned: boolean;
  banReason?: string;
  banExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deleteReason?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 100
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    interestedIn: {
      type: String,
      enum: ['male', 'female', 'both'],
      required: true
    },
    bio: {
      type: String,
      maxlength: 500,
      default: ''
    },
    photos: [{
      type: String,
      default: []
    }],
    location: {
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: false,
        default: ''
      },
      country: {
        type: String,
        required: true
      },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
      }
    },
    interests: [{
      type: String,
      default: []
    }],
    education: {
      type: String,
      default: ''
    },
    occupation: {
      type: String,
      default: ''
    },
    height: {
      type: Number,
      min: 120,
      max: 250
    },
    bodyType: {
      type: String,
      enum: ['slim', 'average', 'athletic', 'curvy', 'heavy'],
      default: 'average'
    },
    smoking: {
      type: String,
      enum: ['never', 'sometimes', 'regularly'],
      default: 'never'
    },
    drinking: {
      type: String,
      enum: ['never', 'sometimes', 'regularly'],
      default: 'sometimes'
    },
    religion: {
      type: String,
      default: ''
    },
    relationshipStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widow'],
      default: 'single'
    },
    relationshipGoals: {
      type: String,
      enum: ['long-term', 'marriage', 'short-term', 'friendship', 'networking', 'serious'],
      default: 'long-term'
    }
  },
  preferences: {
    ageRange: {
      min: {
        type: Number,
        default: 18,
        min: 18
      },
      max: {
        type: Number,
        default: 50,
        max: 100
      }
    },
    maxDistance: {
      type: Number,
      default: 50,
      min: 1,
      max: 500
    },
    interestedIn: {
      type: String,
      enum: ['male', 'female', 'both'],
      required: true
    }
  },
  activity: {
    lastActive: {
      type: Date,
      default: Date.now
    },
    isOnline: {
      type: Boolean,
      default: false
    }
  },
  matches: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  superLikes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'vip'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
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
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String
  },
  banExpiry: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deleteReason: {
    type: String
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index for geospatial queries
UserSchema.index({ 'profile.location.coordinates': '2dsphere' });

// Index for matching queries
UserSchema.index({ 
  'profile.age': 1,
  'profile.gender': 1,
  'profile.interestedIn': 1,
  'activity.lastActive': -1
});

export default mongoose.model<IUser>('User', UserSchema);
