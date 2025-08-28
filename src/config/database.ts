import mongoose from 'mongoose';
import { createDefaultAdmin } from './createDefaultAdmin';

let cachedConnection: typeof mongoose | null = null;

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/matchmaking';
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is required');
      if (process.env.VERCEL) {
        console.error('⚠️ Running in Vercel without MONGODB_URI - some features may not work');
        return;
      }
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    console.log('🔍 MONGODB_URI length:', process.env.MONGODB_URI?.length);
    console.log('🔍 MONGODB_URI starts with:', process.env.MONGODB_URI?.substring(0, 20) + '...');
    
    // For serverless, use a cached connection or create new one
    if (cachedConnection && mongoose.connection.readyState === 1) {
      console.log('🔗 Using cached MongoDB connection');
      return;
    }
    
    const options = {
      serverApi: {
        version: '1' as const,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 1,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 3000, // Very short timeout for serverless
      socketTimeoutMS: 5000, // Very short timeout for serverless
      bufferCommands: false, // Disable buffering for serverless
      bufferMaxEntries: 0,
      connectTimeoutMS: 3000, // Very short timeout for serverless
      retryWrites: false, // Disable retry writes for serverless
      w: 'majority' as const,
    };

    console.log('🔗 Connecting to MongoDB with options:', JSON.stringify(options, null, 2));
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌐 Connection Type: ${process.env.MONGODB_URI ? 'Atlas Cloud' : 'Local'}`);

    // Cache the connection for serverless
    cachedConnection = mongoose;

    // Create default admin after successful connection
    await createDefaultAdmin();
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    console.error('🔧 Please check your MONGODB_URI in Vercel environment variables');
    throw error;
  }
};

export default connectDB;
