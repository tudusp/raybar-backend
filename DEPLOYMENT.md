# 🚀 Deployment Guide - Matchmaking App

## **Recommended Platform: Railway**

Railway is the best choice for your full-stack application because it:
- Handles both frontend and backend in one place
- Provides automatic HTTPS
- Includes database hosting
- Has excellent Node.js support
- Offers reasonable pricing

## **Step 1: Prepare Your Repository**

### 1.1 Create a GitHub Repository
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for deployment"

# Create a new repository on GitHub and push
git remote add origin https://github.com/yourusername/matchmaking-app.git
git push -u origin main
```

### 1.2 Environment Variables
Create these environment variables in Railway:

**Required Environment Variables:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://tudusp:<your_actual_password>@cluster0.jou7c.mongodb.net/matchmaking?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_secure_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=https://your-app-domain.railway.app
```

**Important Notes:**
- Replace `<your_actual_password>` with your actual MongoDB Atlas password
- The database name `matchmaking` will be automatically created
- Make sure your MongoDB Atlas cluster allows connections from all IPs (0.0.0.0/0) for Railway deployment

## **Step 2: Deploy to Railway**

### 2.1 Sign Up for Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Create a new project

### 2.2 Deploy Your App
1. Click "Deploy from GitHub repo"
2. Select your matchmaking repository
3. Railway will automatically detect it's a Node.js app
4. Set the root directory to `/` (root of your project)

### 2.3 Configure Environment Variables
1. Go to your project settings
2. Add all the environment variables listed above
3. Make sure to use a secure JWT_SECRET

### 2.4 Set Up MongoDB Atlas Database

**Option A: Use Your Existing MongoDB Atlas Cluster**
1. Go to your MongoDB Atlas dashboard
2. Navigate to Network Access
3. Add `0.0.0.0/0` to IP Access List (allows Railway to connect)
4. Go to Database Access and ensure your user has read/write permissions
5. Copy your connection string and set it as `MONGODB_URI` environment variable

**Option B: Create New MongoDB Atlas Cluster (if needed)**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (free tier available)
3. Set up database access with username/password
4. Configure network access to allow all IPs (0.0.0.0/0)
5. Get the connection string and set as `MONGODB_URI`

**Connection String Format:**
```
mongodb+srv://tudusp:<password>@cluster0.jou7c.mongodb.net/matchmaking?retryWrites=true&w=majority&appName=Cluster0
```

## **Step 3: Configure Frontend**

### 3.1 Update API Base URL
Update your frontend API configuration to use the Railway URL:

```typescript
// client/src/services/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app-domain.railway.app/api'
  : 'http://localhost:5000/api';
```

### 3.2 Build and Deploy Frontend
```bash
cd client
npm run build
```

### 3.3 Serve Frontend from Backend
Add this to your backend to serve the frontend:

```typescript
// In src/server.ts, add after your API routes:
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}
```

## **Step 4: Alternative Deployment Options**

### **Option A: Vercel + Railway**
- **Frontend**: Deploy to Vercel (excellent for React apps)
- **Backend**: Deploy to Railway
- **Database**: Railway MongoDB

### **Option B: Render**
- Similar to Railway but with a free tier
- Good for budget-conscious deployments

### **Option C: Heroku**
- More expensive but very reliable
- Good for production applications

## **Step 5: Post-Deployment**

### 5.1 Test Your Application
1. Test all major features
2. Verify image uploads work
3. Test real-time chat functionality
4. Check mobile responsiveness

### 5.2 Set Up Monitoring
1. Enable Railway's built-in monitoring
2. Set up error tracking (Sentry recommended)
3. Monitor database performance

### 5.3 Security Checklist
- [ ] HTTPS is enabled
- [ ] Environment variables are secure
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] File uploads are secure

## **Step 6: Custom Domain (Optional)**

1. Purchase a domain (Namecheap, GoDaddy, etc.)
2. Configure DNS to point to Railway
3. Add custom domain in Railway settings
4. Update environment variables with new domain

## **Troubleshooting**

### Common Issues:
1. **Build Failures**: Check Node.js version compatibility
2. **Database Connection**: 
   - Verify MongoDB Atlas URI format
   - Check if IP whitelist includes `0.0.0.0/0`
   - Ensure database user has correct permissions
   - Verify cluster is running and accessible
3. **CORS Errors**: Update FRONTEND_URL environment variable
4. **File Uploads**: Ensure Cloudinary credentials are correct
5. **MongoDB Atlas Connection Issues**:
   - Check if your cluster is paused (free tier limitation)
   - Verify network access settings
   - Ensure connection string includes database name
   - Check if you've exceeded free tier limits

### Support:
- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)

## **Cost Estimation**

**Railway Pricing (Approximate):**
- **Hobby Plan**: $5/month (1GB RAM, shared CPU)
- **Pro Plan**: $20/month (2GB RAM, dedicated CPU)

**MongoDB Atlas Pricing (Approximate):**
- **Free Tier**: $0/month (512MB storage, shared RAM)
- **Shared Cluster**: $9/month (2GB storage, shared RAM)
- **Dedicated Cluster**: $57/month (10GB storage, dedicated RAM)

**Total Estimated Cost**: 
- **Free Tier**: $5-9/month (Railway + MongoDB Atlas free tier)
- **Production**: $14-77/month (depending on your needs)

**Note**: Your current MongoDB Atlas cluster appears to be on a paid plan, so factor that into your costs.

---

**Ready to deploy?** Follow the steps above and your matchmaking app will be live on the internet! 🎉
