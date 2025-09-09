# 🚀 Production Deployment Guide

## Free Tier Production Setup

### 1. MongoDB Atlas Setup (Database - FREE)
- [ ] Create account at https://mongodb.com/cloud/atlas
- [ ] Create M0 Sandbox cluster (512MB free)
- [ ] Create database user: `smp-user`
- [ ] Set network access to `0.0.0.0/0`
- [ ] Get connection string: `mongodb+srv://smp-user:PASSWORD@cluster0.xxxxx.mongodb.net/streetperformersmap`

### 2. Upstash Redis Setup (Cache - FREE)
- [ ] Create account at https://upstash.com
- [ ] Create Redis database (10k requests/day free)
- [ ] Get Redis URL: `redis://default:PASSWORD@region.upstash.io:PORT`

### 3. Railway Setup (Backend - $5 credit monthly)
- [ ] Create account at https://railway.app
- [ ] Connect GitHub repository
- [ ] Deploy backend service
- [ ] Set environment variables (see below)

### 4. Netlify Setup (Frontend - FREE)
- [ ] Create account at https://netlify.com
- [ ] Connect GitHub repository  
- [ ] Set build command: `pnpm --filter @spm/frontend build`
- [ ] Set publish directory: `apps/frontend/dist`

## Environment Variables

### Backend (Railway)
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://smp-user:PASSWORD@cluster0.xxxxx.mongodb.net/streetperformersmap
REDIS_URL=redis://default:PASSWORD@region.upstash.io:PORT
JWT_SECRET=your-super-secret-jwt-key-here
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key  # Start with test, switch to live later
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key  
CLOUDINARY_API_SECRET=your_api_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
FRONTEND_URL=https://your-app.netlify.app
API_BASE_URL=https://your-backend.railway.app/api/v1
```

### Frontend (Netlify)
```env
VITE_API_URL=https://your-backend.railway.app/api/v1
VITE_WS_URL=wss://your-backend.railway.app
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key  # Start with test
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Deployment Steps

### Phase 1: Database & Cache
1. Set up MongoDB Atlas cluster
2. Set up Upstash Redis  
3. Test connections locally

### Phase 2: Backend Deployment
1. Deploy to Railway
2. Configure environment variables
3. Test API endpoints

### Phase 3: Frontend Deployment  
1. Deploy to Netlify
2. Configure build settings
3. Test full application

### Phase 4: Stripe Integration
1. Configure webhooks
2. Test payments with test cards
3. Switch to live mode when ready

## Testing Checklist

### Backend Health Checks
- [ ] GET /health returns 200
- [ ] Database connection working
- [ ] Redis connection working
- [ ] All API routes accessible

### Frontend Tests
- [ ] App loads without errors
- [ ] Authentication working (Clerk)
- [ ] Map functionality working
- [ ] Performance creation working

### Stripe Payment Tests
- [ ] Tip creation flow
- [ ] Webhook processing
- [ ] Payment success/failure handling
- [ ] Connect account creation for performers

## Production URLs
- Frontend: https://your-app.netlify.app
- Backend API: https://your-backend.railway.app
- Database: MongoDB Atlas cluster
- Cache: Upstash Redis