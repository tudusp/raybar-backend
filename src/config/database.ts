import mongoose from 'mongoose';
import { createDefaultAdmin } from './createDefaultAdmin';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/matchmaking';
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is required');
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    const options = {
      serverApi: {
        version: '1' as const,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: true, // Enable buffer commands for serverless
      connectTimeoutMS: 10000,
    };

    console.log('🔗 Connecting to MongoDB...');
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
