import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email: string;
  subject: string;
  category: 'general' | 'technical' | 'billing' | 'account' | 'safety' | 'feedback' | 'other';
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: mongoose.Types.ObjectId;
  adminNotes?: string;
  responseMessage?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['general', 'technical', 'billing', 'account', 'safety', 'feedback', 'other'],
    default: 'general'
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'resolved', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  responseMessage: {
    type: String,
    trim: true
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
ContactSchema.index({ status: 1 });
ContactSchema.index({ category: 1 });
ContactSchema.index({ priority: 1 });
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ email: 1 });

export default mongoose.model<IContact>('Contact', ContactSchema);
