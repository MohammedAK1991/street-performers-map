#!/bin/bash

echo "🚀 Street Performers Map - Production Deployment"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo -e "${RED}❌ Error: Must be on main branch to deploy${NC}"
    echo "Current branch: $BRANCH"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}❌ Error: Uncommitted changes detected${NC}"
    echo "Please commit or stash your changes before deploying"
    exit 1
fi

echo -e "${YELLOW}🔍 Pre-deployment checks...${NC}"

# Run tests
echo "Running tests..."
pnpm test:ci
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests failed! Deployment aborted.${NC}"
    exit 1
fi

# Build everything
echo "Building all packages..."
pnpm build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Deployment aborted.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All checks passed!${NC}"

# Deploy via git push (triggers GitHub Actions)
echo -e "${YELLOW}🚀 Deploying to production...${NC}"
git push origin main

echo -e "${GREEN}✅ Deployment triggered!${NC}"
echo ""
echo "Monitor deployment progress at:"
echo "🔗 GitHub Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
echo ""
echo "Expected production URLs:"
echo "🌐 Frontend: https://your-app.netlify.app"
echo "⚡ Backend: https://your-backend.railway.app"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Wait for deployment to complete (~5 minutes)"
echo "2. Test the production URLs above"
echo "3. Run Stripe payment tests using STRIPE_TESTING.md"
echo ""
echo -e "${GREEN}🎉 Deployment initiated successfully!${NC}"