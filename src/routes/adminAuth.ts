import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';

const router = express.Router();

// Admin Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req: express.Request, res: express.Response) => {
  try {
    console.log('🔍 Admin login attempt:', { email: req.body.email });
    console.log('🔍 JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('🔍 JWT_SECRET length:', process.env.JWT_SECRET?.length);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update login stats
    admin.lastLogin = new Date();
    admin.loginCount += 1;
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin._id, 
        email: admin.email, 
        role: admin.role,
        permissions: admin.permissions 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// Admin Registration (only for first admin or by super admin)
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('role').optional().isIn(['super_admin', 'admin', 'moderator'])
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role = 'moderator' } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    // Check if this is the first admin (allow super_admin role)
    const adminCount = await Admin.countDocuments();
    const isFirstAdmin = adminCount === 0;
    
    if (!isFirstAdmin && role === 'super_admin') {
      return res.status(403).json({ message: 'Only the first admin can be a super admin' });
    }

    // Create new admin
    const admin = new Admin({
      email,
      password,
      firstName,
      lastName,
      role: isFirstAdmin ? 'super_admin' : role,
      permissions: {
        userManagement: role === 'super_admin' || role === 'admin',
        contentModeration: true,
        analytics: role === 'super_admin' || role === 'admin',
        subscriptionManagement: role === 'super_admin' || role === 'admin',
        systemSettings: role === 'super_admin'
      }
    });

    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin._id, 
        email: admin.email, 
        role: admin.role,
        permissions: admin.permissions 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current admin profile
router.get('/profile', async (req: express.Request, res: express.Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const admin = await Admin.findById(decoded.adminId).select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ admin });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
