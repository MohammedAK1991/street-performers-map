#!/bin/bash

echo "🚂 Complete Railway Deployment Script"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Build everything locally first
echo -e "${YELLOW}📦 Building project locally first...${NC}"
pnpm build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Local build failed! Fix errors first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Local build successful!${NC}"

# Step 2: Login to Railway
echo -e "${YELLOW}🔐 Logging into Railway...${NC}"
railway login
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Railway login failed!${NC}"
    exit 1
fi

# Step 3: Initialize or link project
echo -e "${YELLOW}🔗 Setting up Railway project...${NC}"
if [ ! -f ".railway/project.json" ]; then
    echo "Creating new Railway project..."
    railway init --name "street-performers-map"
else
    echo "Using existing Railway project..."
fi

# Step 4: Set environment variables
echo -e "${YELLOW}⚙️ Setting environment variables...${NC}"

# Core variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set API_VERSION=v1

# Database - REPLACE WITH YOUR ACTUAL MONGODB URI
railway variables set MONGODB_URI="YOUR_MONGODB_CONNECTION_STRING_HERE"

# JWT
railway variables set JWT_SECRET="your-super-secret-jwt-key-change-in-production-make-this-longer-and-more-random"
railway variables set JWT_EXPIRES_IN="7d"

# Google Maps - REPLACE WITH YOUR ACTUAL API KEY
railway variables set GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY_HERE"

# File upload
railway variables set MAX_FILE_SIZE="100MB"

# Cloudinary - REPLACE WITH YOUR ACTUAL CREDENTIALS
railway variables set CLOUDINARY_CLOUD_NAME="YOUR_CLOUDINARY_CLOUD_NAME"
railway variables set CLOUDINARY_API_KEY="YOUR_CLOUDINARY_API_KEY"
railway variables set CLOUDINARY_API_SECRET="YOUR_CLOUDINARY_API_SECRET"

# Rate limiting
railway variables set RATE_LIMIT_WINDOW_MS="900000"
railway variables set RATE_LIMIT_MAX_REQUESTS="100"

# Logging
railway variables set LOG_LEVEL="info"

# Stripe - REPLACE WITH YOUR ACTUAL KEYS
railway variables set STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY"
railway variables set STRIPE_WEBHOOK_SECRET="YOUR_STRIPE_WEBHOOK_SECRET"

echo -e "${GREEN}✅ Environment variables set!${NC}"

# Step 5: Deploy!
echo -e "${YELLOW}🚀 Deploying to Railway...${NC}"
railway up --detach

# Step 6: Get the URL
echo -e "${YELLOW}🔍 Getting deployment URL...${NC}"
sleep 5
RAILWAY_URL=$(railway status --json | grep -o '"url":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "")

echo ""
echo -e "${GREEN}🎉 Deployment initiated!${NC}"
echo ""
echo -e "${BLUE}📊 Monitor deployment:${NC}"
echo "railway logs --tail"
echo ""
echo -e "${BLUE}🌐 Your app will be available at:${NC}"
if [ -n "$RAILWAY_URL" ]; then
    echo "$RAILWAY_URL"
else
    echo "Check Railway dashboard for URL"
fi
echo ""
echo -e "${BLUE}🔗 Railway Dashboard:${NC}"
echo "https://railway.app/dashboard"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Wait for deployment (~5 minutes)"
echo "2. Test the URL above"
echo "3. Check logs: railway logs"
echo "4. Test Stripe payments with test cards"
echo ""
echo -e "${GREEN}🚂 All aboard the Railway! 🎉${NC}"