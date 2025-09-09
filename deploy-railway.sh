#!/bin/bash

echo "🚂 Railway Deployment for Street Performers Map"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Installing Railway CLI...${NC}"
    npm install -g @railway/cli
fi

echo -e "${YELLOW}🔍 Pre-deployment checks...${NC}"

# Test build locally first
echo "Testing build..."
pnpm build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Fix errors first.${NC}"
    exit 1
fi

# Build frontend 
echo "Building frontend..."
pnpm --filter @smp/frontend build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Builds successful!${NC}"

# Login to Railway (if not already)
echo -e "${YELLOW}🚂 Logging into Railway...${NC}"
railway login

# Link or create project
echo -e "${YELLOW}🔗 Setting up Railway project...${NC}"
if [ ! -f ".railway/project.json" ]; then
    echo "Creating new Railway project..."
    railway init
fi

# Deploy!
echo -e "${YELLOW}🚀 Deploying to Railway...${NC}"
railway up

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌐 Your app will be available at:"
echo "📱 https://your-project.railway.app"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set environment variables in Railway dashboard"
echo "2. Wait for deployment to complete (~2-3 minutes)"
echo "3. Test the URL above"
echo ""
echo "🔗 Railway Dashboard: https://railway.app/dashboard"