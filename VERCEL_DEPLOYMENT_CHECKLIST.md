# Vercel Deployment Checklist

## Environment Variables Required

Make sure these are set in your Vercel dashboard under Settings > Environment Variables:

### Required Variables:
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - A secure random string for JWT token signing

### Optional Variables:
- `CLOUDINARY_CLOUD_NAME` - For image uploads
- `CLOUDINARY_API_KEY` - For image uploads  
- `CLOUDINARY_API_SECRET` - For image uploads
- `NODE_ENV` - Should be set to "production"

## Deployment Steps:

1. **Set Environment Variables** in Vercel Dashboard
2. **Deploy** using `vercel --prod` or push to main branch
3. **Test Health Endpoint**: `https://your-app.vercel.app/api/health`
4. **Check Logs** in Vercel Dashboard for any errors

## Common Issues:

### 500 Internal Server Error
- Check if `MONGODB_URI` is set correctly
- Verify `JWT_SECRET` is set
- Check Vercel function logs for specific error messages

### Database Connection Issues
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0` (all IPs)
- Verify connection string format
- Check if database user has proper permissions

### CORS Issues
- Frontend URL should be added to CORS allowed origins
- Check browser console for CORS errors

## Testing:

1. **Health Check**: `GET /api/health`
2. **CORS Test**: `GET /api/cors-test`
3. **Database Test**: Try a simple API endpoint that requires database

## Monitoring:

- Check Vercel Function Logs
- Monitor MongoDB Atlas metrics
- Set up error tracking if needed
