# 🚀 Render Deployment Guide for Prime Addis Coffee

## Prerequisites

1. **MongoDB Atlas Account** (Free tier available)
   - Create a cluster at https://cloud.mongodb.com
   - Get your connection string
   - Whitelist all IPs (0.0.0.0/0) for Render

2. **Render Account** (Free tier available)
   - Sign up at https://render.com
   - Connect your GitHub repository

## Step-by-Step Deployment

### 1. Prepare MongoDB Atlas

1. Create a MongoDB Atlas cluster
2. Create a database user
3. Get connection string (replace `<password>` with actual password)
4. Whitelist all IPs: `0.0.0.0/0`

### 2. Deploy to Render

1. **Connect Repository**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `prime-addis-coffee`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

3. **Set Environment Variables**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/restaurant-management
   JWT_SECRET=your-super-secure-jwt-secret-key
   NEXTAUTH_URL=https://your-app-name.onrender.com
   NODE_ENV=production
   ```

### 3. Initial Database Setup

After deployment, seed your database:

1. Use the admin panel to create initial users
2. Or run the seed script manually through Render shell

### 4. Test Your Deployment

1. Visit your Render URL
2. Test login functionality
3. Create test orders
4. Verify notifications work

## Important Notes

- **Free tier limitations**: Apps sleep after 15 minutes of inactivity
- **Database**: Use MongoDB Atlas (free tier: 512MB)
- **Environment Variables**: Set in Render dashboard, not in code
- **HTTPS**: Render provides free SSL certificates

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

2. **Database Connection Fails**
   - Verify MongoDB URI format
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has correct permissions

3. **App Crashes**
   - Check Render logs
   - Verify environment variables are set
   - Check for missing dependencies

### Useful Commands:

```bash
# Check logs
render logs --service-id your-service-id

# Manual deployment
git push origin main
```

## Performance Tips

1. **Upgrade to paid plan** for better performance
2. **Use MongoDB Atlas M2+** for production workloads
3. **Enable caching** for static assets
4. **Monitor performance** through Render dashboard

## Security Checklist

- ✅ Strong JWT secret (32+ characters)
- ✅ MongoDB Atlas with authentication
- ✅ Environment variables (not hardcoded)
- ✅ HTTPS enabled (automatic on Render)
- ✅ Input validation on all forms
- ✅ Rate limiting (consider adding)

## Support

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Next.js Deployment**: https://nextjs.org/docs/deployment