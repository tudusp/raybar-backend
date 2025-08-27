import mongoose from 'mongoose';
import { createDefaultAdmin } from './createDefaultAdmin';

const connectDB = async (): Promise<void> => {
  try {
    // Use MongoDB Atlas URI from environment variable, fallback to local MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/matchmaking';
    
    // MongoDB Atlas connection options
    const options = {
      serverApi: {
        version: '1' as const,
        strict: true,
        deprecationErrors: true,
      },
      // Additional options for better performance and reliability
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };
    
    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌐 Connection Type: ${process.env.MONGODB_URI ? 'Atlas Cloud' : 'Local'}`);
    
    // Create default admin after successful connection
    await createDefaultAdmin();
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
