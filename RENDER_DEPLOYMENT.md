# Render Deployment Guide

## 🚀 Deploy to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your GitHub repository

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `tudusp/raybar-backend`
3. Configure the service:
   - **Name**: `raybar-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### Step 3: Environment Variables
Add these in Render dashboard:
```
MONGODB_URI=mongodb+srv://tudusp:tpass4db@cluster0.jou7c.mongodb.net/matchmaking?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Your backend will be available at: `https://your-app-name.onrender.com`

### Step 5: Update Frontend
Update `client/src/services/api.ts`:
```typescript
const API_CONFIG = {
  VERCEL_URL: 'https://your-app-name.onrender.com/api', // Update this
  LOCAL_URL: 'http://localhost:5000/api',
  USE_VERCEL: process.env.NODE_ENV === 'production' || window.location.hostname.includes('vercel.app')
};
```

## ✅ Benefits of Render
- ✅ Better MongoDB support
- ✅ No serverless limitations
- ✅ Free tier available
- ✅ Automatic deployments
- ✅ Custom domains

## 🔧 Troubleshooting
- If deployment fails, check build logs
- Ensure all environment variables are set
- MongoDB Atlas IP whitelist should include `0.0.0.0/0`
