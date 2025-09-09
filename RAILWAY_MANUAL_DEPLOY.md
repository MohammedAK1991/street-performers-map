# 🚂 Complete Railway Deployment Guide

## Option 1: Automated CLI Script (Recommended)

**Run this single command:**
```bash
./railway-deploy.sh
```

This script will:
- ✅ Test build locally first
- ✅ Login to Railway 
- ✅ Create/link project
- ✅ Set ALL environment variables
- ✅ Deploy your app
- ✅ Give you the production URL

## Option 2: Manual Steps

### 1. Railway CLI Setup
```bash
# Install CLI (already done)
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init --name "street-performers-map"
```

### 2. Set Environment Variables
```bash
# Copy from .env.railway or set one by one:
railway variables set NODE_ENV=production
railway variables set MONGODB_URI="mongodb+srv://mohammedak1991:Manunited_123@streetperfromersmap.phcfnyd.mongodb.net/streetperformersmap"
# ... (see script for all variables)
```

### 3. Deploy
```bash
railway up
```

## Option 3: GitHub Integration (Current)

Your current GitHub deployment should work now with the fixed railway.toml!

**Just push your latest changes:**
```bash
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main
```

Railway will auto-deploy from GitHub.

## What's Different Now

### ✅ Fixed railway.toml:
- Correct package names: `@spm/` not `@smp/`
- Proper build sequence
- Correct file copying

### ✅ Complete Environment Variables:
- Fixed MongoDB URI with database name
- All your actual API keys
- Production-optimized settings

### ✅ Full-Stack Configuration:
- Backend serves frontend static files
- Single domain (no CORS issues)
- Health checks configured

## Expected Results

**After deployment:**
- 🌐 **URL**: https://your-project.railway.app
- 🏥 **Health**: https://your-project.railway.app/health
- 📚 **API Docs**: https://your-project.railway.app/api/docs
- 🎨 **Frontend**: https://your-project.railway.app (React app)

## Monitoring

```bash
# Watch deployment logs
railway logs --tail

# Check status
railway status

# Open in browser
railway open
```

## Troubleshooting

If deployment fails:
1. Check logs: `railway logs`
2. Verify environment variables: `railway variables`
3. Test build locally: `pnpm build`
4. Check railway.toml syntax

The automated script handles all of this! 🚀