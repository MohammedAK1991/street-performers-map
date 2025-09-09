# 🍃 MongoDB Atlas Setup Guide

## Step 1: Create Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google (easiest)
3. Choose "I'm building a new application"
4. Select "JavaScript" and "I prefer to learn on my own"

## Step 2: Create Free Cluster
1. Click "Build a Database"
2. Choose "M0 FREE" (512 MB storage, shared)
3. Provider: AWS (usually fastest)
4. Region: Choose closest to you
5. Cluster Name: "StreetPerformersMap"
6. Click "Create Cluster"

## Step 3: Create Database User
1. In "Security" → "Database Access"
2. Click "Add New Database User"
3. Authentication: "Password"
4. Username: `smp-user`
5. Password: Click "Autogenerate" (SAVE THIS PASSWORD!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

## Step 4: Allow Network Access
1. In "Security" → "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Comment: "All IPs for Railway deployment"
5. Click "Confirm"

## Step 5: Get Connection String
1. Go back to "Database" → "Browse Collections"
2. Click "Connect" button
3. Choose "Connect your application"
4. Driver: Node.js, Version: 5.5 or later
5. Copy the connection string - it looks like:

```
mongodb+srv://smp-user:<password>@streetperformersmap.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

6. Replace `<password>` with your actual password
7. Add `/streetperformersmap` before the `?` to specify database name:

```
mongodb+srv://smp-user:YOUR_PASSWORD@streetperformersmap.xxxxx.mongodb.net/streetperformersmap?retryWrites=true&w=majority
```

## Test Connection Locally
```bash
# Test with your backend
cd apps/backend
MONGODB_URI="your-connection-string" pnpm dev

# Should see: "✅ Connected to MongoDB"
```

## Your Final Connection String
Save this for Railway environment variables:
```
mongodb+srv://smp-user:YOUR_PASSWORD@streetperformersmap.xxxxx.mongodb.net/streetperformersmap?retryWrites=true&w=majority
```