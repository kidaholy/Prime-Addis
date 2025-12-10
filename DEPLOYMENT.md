# 🚀 Prime Addis Coffee - Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. MongoDB Atlas Setup
- [ ] **Whitelist Deployment IPs**: Add `0.0.0.0/0` in Network Access (or specific deployment platform IPs)
- [ ] **Database User**: Verify `kidayos2014` has "Read and write to any database" permissions
- [ ] **Cluster Status**: Ensure cluster is running (not paused)
- [ ] **Connection String**: Verified working with your credentials

### 2. Environment Variables
Update these in your deployment platform:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://kidayos2014:holyunion@cluster0.tcqv1p5.mongodb.net/restaurant-management?retryWrites=true&w=majority&appName=prime-addis-coffee

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL (Update with your domain)
FRONTEND_URL=https://your-deployed-domain.com
```

### 3. Database Seeding
After deployment, seed your database:

```bash
# Seed menu items (59 items across 16 categories)
npx tsx scripts/seed-menu-only.ts

# Or seed with users + menu
npx tsx scripts/seed.ts
```

### 4. Admin Login
- **Email**: `kidayos2014@gmail.com`
- **Password**: `123456`

## 🌐 Deployment Platforms

### Vercel
1. Connect your GitHub repo
2. Add environment variables in Vercel dashboard
3. Deploy automatically

### Railway
1. Connect GitHub repo
2. Add environment variables
3. Deploy with one click

### Render
1. Connect GitHub repo
2. Set environment variables
3. Deploy web service

### Heroku
1. Create Heroku app
2. Set config vars (environment variables)
3. Deploy from GitHub

## 🔧 Post-Deployment

### 1. Test System Health
Visit: `https://your-domain.com/api/system-check`

Should return:
```json
{
  "overall": "✅ Healthy",
  "checks": {
    "database": {"status": "✅ Connected"},
    "collections": {"status": "✅ Available"},
    "environment": {"status": "✅ Loaded"}
  }
}
```

### 2. Test Admin Login
1. Go to `https://your-domain.com`
2. Login with admin credentials
3. Access admin dashboard
4. Verify menu items are loaded

### 3. Security Updates
- [ ] Change JWT_SECRET to a strong random key
- [ ] Update FRONTEND_URL to your actual domain
- [ ] Consider restricting MongoDB Atlas IP whitelist to deployment IPs only

## 📱 Features Available
- ✅ Menu Management (59 items, 16 categories)
- ✅ User Management (Admin, Cashier, Chef roles)
- ✅ Order Management
- ✅ POS System
- ✅ Kitchen Display
- ✅ Reports & Analytics
- ❌ Inventory Management (Removed as requested)

## 🆘 Troubleshooting

### MongoDB Connection Issues
1. Check Atlas Network Access whitelist
2. Verify database user permissions
3. Ensure cluster is not paused
4. Test connection string format

### Environment Variable Issues
1. Verify all required env vars are set
2. Check JWT_SECRET is properly configured
3. Ensure FRONTEND_URL matches your domain

### Build Issues
1. Run `npm run build` locally first
2. Check for TypeScript errors
3. Verify all dependencies are installed