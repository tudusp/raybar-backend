import mongoose from 'mongoose';
import { createDefaultAdmin } from './createDefaultAdmin';

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
    
    const options = {
      serverApi: {
        version: '1' as const,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 5, // Reduced for serverless
      serverSelectionTimeoutMS: 30000, // Increased timeout
      socketTimeoutMS: 45000,
      bufferCommands: true, // Enable buffer commands for serverless
      connectTimeoutMS: 30000, // Increased timeout
      retryWrites: true,
      w: 'majority' as const,
      // Add these for better serverless compatibility
      keepAlive: true,
      keepAliveInitialDelay: 300000,
      autoReconnect: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000,
    };

    console.log('🔗 Connecting to MongoDB with options:', JSON.stringify(options, null, 2));
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌐 Connection Type: ${process.env.MONGODB_URI ? 'Atlas Cloud' : 'Local'}`);

    // Create default admin after successful connection
    await createDefaultAdmin();
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    console.error('🔧 Please check your MONGODB_URI in Vercel environment variables');
    throw error;
  }
};

export default connectDB;
