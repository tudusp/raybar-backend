import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import matchRoutes from './routes/matches';
import chatRoutes from './routes/chat';
import searchRoutes from './routes/search';
import adminRoutes from './routes/admin';
import adminAuthRoutes from './routes/adminAuth';
import subscriptionRoutes from './routes/subscriptions';
import uploadRoutes from './routes/upload';
import contactRoutes from './routes/contact';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { setupSocketHandlers } from './socket/socketHandlers';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Check required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please set these variables in your Vercel dashboard');
  // Don't exit in serverless environment, just log the error
  if (!process.env.VERCEL) {
    process.exit(1);
  }
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins in development
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB
let dbConnected = false;
console.log('🔍 Starting database connection...');
console.log('🔍 MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('🔍 VERCEL environment:', !!process.env.VERCEL);

connectDB().then(() => {
  console.log('✅ Database connected successfully');
  dbConnected = true;
}).catch((error) => {
  console.error('❌ Database connection failed:', error);
  dbConnected = false;
});

// Add database connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
  dbConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  dbConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB connection disconnected');
  dbConnected = false;
});

// Check if already connected
if (mongoose.connection.readyState === 1) {
  console.log('✅ MongoDB already connected');
  dbConnected = true;
}

// CORS middleware - apply first
app.use(cors({
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow your Vercel frontend domains
    if (origin.includes('raybar.vercel.app') || 
        origin.includes('raybar-budi.vercel.app') ||
        origin.includes('raybar-git-main-s-p-tudus-projects.vercel.app') ||
        origin.includes('vercel.app') || 
        origin.includes('netlify.app')) {
      return callback(null, true);
    }
    
    // Allow all origins in development and for Vercel
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL) {
      return callback(null, true);
    }
    
    // In production, you can restrict to specific domains
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Rate limiting - more generous for chat applications
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 requests per windowMs for chat endpoints
  message: 'Too many chat requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs for auth endpoints
  message: 'Too many authentication requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Development rate limiter (more lenient)
const devLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per windowMs for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable CSP for development
}));
app.use(devLimiter); // Use development rate limiter for general requests

// Additional CORS handling for preflight requests
app.options('*', (req, res) => {
  console.log('CORS preflight request from:', req.headers.origin);
  console.log('CORS preflight method:', req.method);
  console.log('CORS preflight headers:', req.headers);
  
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

  // Routes with specific rate limiting
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/admin/auth', authLimiter, adminAuthRoutes);
  app.use('/api/chat', chatLimiter, chatRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/upload', authenticate, uploadRoutes);
  app.use('/api/contact', contactRoutes);
  
  // Serve uploaded files with CORS headers
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  }, express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check request from:', req.headers.origin);
  res.status(200).json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    database: dbConnected ? 'connected' : 'disconnected',
    version: '3.0.1',
    buildTime: new Date().toISOString()
  });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(500).json({ 
        message: 'Database not connected',
        dbConnected: false
      });
    }
    
    // Test database connection by counting users
    const userCount = await require('../models/User').countDocuments();
    
    res.status(200).json({ 
      message: 'Database connection working',
      dbConnected: true,
      userCount: userCount
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      dbConnected: false
    });
  }
});

// Cloudinary test endpoint
app.get('/api/cloudinary-test', (req, res) => {
  const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not Set',
    api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not Set',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not Set'
  };
  
  res.status(200).json({ 
    message: 'Cloudinary configuration check',
    config: cloudinaryConfig,
    allSet: cloudinaryConfig.cloud_name === 'Set' && 
            cloudinaryConfig.api_key === 'Set' && 
            cloudinaryConfig.api_secret === 'Set'
  });
});

// Direct MongoDB connection test
app.get('/api/mongo-test', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      return res.status(500).json({ 
        message: 'MONGODB_URI not found',
        hasUri: false
      });
    }
    
    console.log('🔍 Testing MongoDB connection...');
    console.log('🔍 URI length:', mongoURI.length);
    
    // Use the main mongoose connection
    if (mongoose.connection.readyState === 1) {
      // Already connected
      res.status(200).json({ 
        message: 'MongoDB already connected',
        hasUri: true,
        connected: true,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState
      });
    } else {
      // Try to connect
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      
      res.status(200).json({ 
        message: 'MongoDB connection successful',
        hasUri: true,
        connected: true,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState
      });
    }
  } catch (error) {
    console.error('MongoDB test error:', error);
    res.status(500).json({ 
      message: 'MongoDB connection failed',
      hasUri: !!process.env.MONGODB_URI,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Model test endpoint
app.get('/api/model-test', async (req, res) => {
  try {
    const User = require('./models/User');
    const Admin = require('./models/Admin');
    
    // Test User model
    const userCount = await User.countDocuments();
    
    // Test Admin model
    const adminCount = await Admin.countDocuments();
    
    res.status(200).json({ 
      message: 'Models working correctly',
      userCount: userCount,
      adminCount: adminCount,
      modelsLoaded: true
    });
  } catch (error) {
    console.error('Model test error:', error);
    res.status(500).json({ 
      message: 'Model test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  console.log('CORS test request from:', req.headers.origin);
  res.status(200).json({ message: 'CORS is working!', origin: req.headers.origin });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint request from:', req.headers.origin);
  res.status(200).json({ 
    message: 'API is working!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    version: '3.0.0'
  });
});

// Simple debug endpoint
app.get('/api/debug', (req, res) => {
  res.status(200).json({ 
    message: 'Debug endpoint working!',
    timestamp: new Date().toISOString(),
    version: '3.0.0'
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../client/dist');
  const indexPath = path.join(frontendPath, 'index.html');
  
  // Check if frontend build exists
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    app.use(express.static(frontendPath));
    
    app.get('*', (req, res) => {
      res.sendFile(indexPath);
    });
  } else {
    // If no frontend build, just serve API
    app.get('/', (req, res) => {
      res.json({ 
        message: 'Matchmaking API Server', 
        status: 'running',
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          users: '/api/users',
          matches: '/api/matches',
          chat: '/api/chat',
          admin: '/api/admin'
        }
      });
    });
  }
}

// Socket.IO setup
if (process.env.VERCEL) {
  console.log('⚠️ Socket.IO disabled on Vercel serverless - using polling fallback');
  // For Vercel, we'll use polling instead of WebSockets
  app.get('/api/socket-status', (req, res) => {
    res.json({ 
      status: 'polling',
      message: 'WebSocket not available on serverless, using polling fallback'
    });
  });
} else {
  setupSocketHandlers(io);
}

// Error handling middleware
app.use(errorHandler);

// For Vercel serverless deployment
export default app;

// Local development server (only run if not on Vercel)
if (!process.env.VERCEL) {
  const PORT = parseInt(process.env.PORT || '5000', 10);

  // Simple port finding function
  const findAvailablePort = async (startPort: number): Promise<number> => {
    const net = require('net');
    
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      
      server.listen(startPort, () => {
        const port = server.address().port;
        server.close(() => resolve(port));
      });
      
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(findAvailablePort(startPort + 1));
        } else {
          reject(err);
        }
      });
    });
  };

  // Start server with available port
  findAvailablePort(PORT).then((port) => {
    server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`🌐 Network accessible at: http://0.0.0.0:${port}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
    });
  }).catch((err) => {
    console.error('❌ Failed to find available port:', err);
    process.exit(1);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
