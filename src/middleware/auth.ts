import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import Admin, { IAdmin } from '../models/Admin';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

export interface AdminAuthRequest extends Request {
  admin?: IAdmin;
  adminId?: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 Auth middleware - URL:', req.url);
    console.log('🔐 Auth middleware - Method:', req.method);
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('🔐 Auth middleware - Token provided:', !!token);

    if (!token) {
      console.log('❌ Auth middleware - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    console.log('🔐 Auth middleware - Token decoded, userId:', decoded.userId);
    
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      console.log('❌ Auth middleware - User not found:', decoded.userId);
      return res.status(401).json({ message: 'Invalid token.' });
    }

    console.log('✅ Auth middleware - User authenticated:', user._id);
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

export const adminAuth = async (req: AdminAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      adminId: string; 
      email: string; 
      role: string; 
      permissions: any; 
    };
    
    const admin = await Admin.findById(decoded.adminId).select('-password');

    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Invalid admin token.' });
    }

    req.adminId = decoded.adminId;
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ message: 'Invalid admin token.' });
  }
};
