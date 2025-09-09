# 🚂 Railway Environment Variables

## Required Environment Variables for Railway

Copy these into Railway Dashboard → Your Project → Variables:

```env
# Application
NODE_ENV=production
PORT=3001

# Database (your MongoDB Atlas connection string)
MONGODB_URI=mongodb+srv://smp-user:YOUR_PASSWORD@streetperformersmap.xxxxx.mongodb.net/streetperformersmap?retryWrites=true&w=majority

# Redis (optional - can skip for now)
# REDIS_URL=redis://localhost:6379

# JWT Secret (any random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

# Stripe (start with test keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Cloudinary (for media uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Frontend URL (Railway will provide this after first deploy)
FRONTEND_URL=https://your-project.railway.app
```

## How to Set These in Railway:

1. Go to your Railway project dashboard
2. Click "Variables" tab
3. Click "New Variable" 
4. Enter each key-value pair above
5. Click "Deploy" to restart with new variables

## Critical Variables to Set First:

**Must have these to start:**
- `NODE_ENV=production`
- `MONGODB_URI=your-connection-string`
- `JWT_SECRET=any-long-random-string`

**Can add later:**
- Stripe keys (for payment testing)
- Clerk keys (for authentication)
- Cloudinary keys (for media uploads)

## Testing Order:

1. **Deploy with minimal variables** (NODE_ENV, MONGODB_URI, JWT_SECRET)
2. **Test basic functionality** (app loads, database connects)
3. **Add authentication** (Clerk variables)
4. **Add payments** (Stripe variables)
5. **Add media uploads** (Cloudinary variables)

This way you can debug issues step by step!