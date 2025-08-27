# Admin Panel Setup Guide

## Overview
The MatchMaker app includes a comprehensive admin panel for managing users, subscriptions, and system settings.

## Initial Setup

### 1. Create First Admin User
The first admin user is automatically created when you run the application for the first time. The default credentials are:

- **Email**: `admin@matchmaker.com`
- **Password**: `admin123456`
- **Role**: Super Admin

### 2. Access Admin Panel
There are two ways to access the admin panel:

#### Option 1: From Dashboard
1. Login to the app as a regular user
2. Go to Dashboard
3. Click on the "Admin Panel" card
4. You'll be redirected to the admin login page

#### Option 2: Direct URL
Navigate directly to: `http://localhost:5173/admin/login`

## Admin Features

### Dashboard
- View total users, active users, premium users
- See banned users count
- Monitor new users this week

### User Management
- View all users with search and filtering
- Ban/unban users
- View user details and activity
- Filter by subscription plan and status

### Subscription Management
- View subscription analytics
- Manage user subscription plans
- Monitor premium features usage

### Reports
- View user reports
- Content moderation tools
- System reports

### Settings
- System configuration
- Admin user management
- Permission settings

## Admin Roles

### Super Admin
- Full access to all features
- Can create other admin users
- System settings access
- User management
- Subscription management

### Admin
- User management
- Content moderation
- Analytics access
- Subscription management
- Cannot access system settings

### Moderator
- Content moderation only
- Basic user management
- Limited analytics access

## Security Notes

⚠️ **Important**: Change the default admin password after first login!

The default credentials are for initial setup only. For production use:
1. Login with default credentials
2. Change the password immediately
3. Create additional admin users as needed
4. Remove or secure the default admin account

## API Endpoints

### Admin Authentication
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/register` - Create new admin (super admin only)
- `GET /api/admin/auth/profile` - Get admin profile

### Admin Management
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:userId/ban` - Ban/unban user
- `PATCH /api/admin/users/:userId/subscription` - Update user subscription
- `GET /api/admin/subscriptions/analytics` - Subscription analytics
- `GET /api/admin/reports` - Get reports

## Troubleshooting

### Can't Access Admin Panel
1. Ensure you're using the correct credentials
2. Check if the admin user exists in the database
3. Verify the server is running
4. Check browser console for errors

### Permission Denied
1. Verify your admin role has the required permissions
2. Contact super admin for permission upgrades
3. Check if your account is active

### Database Issues
1. Ensure MongoDB is running
2. Check database connection
3. Verify admin collection exists
