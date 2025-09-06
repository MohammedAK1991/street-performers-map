# Cloudinary Setup Guide

The video upload feature requires Cloudinary configuration. Follow these steps to set it up:

## 1. Create Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. After signing up, you'll be taken to your dashboard
3. Note down your **Cloud Name**, **API Key**, and **API Secret**

## 2. Configure Backend Environment Variables

Create a `.env` file in the `apps/backend/` directory with the following content:

```bash
# Server Configuration
NODE_ENV=development
PORT=3001
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/street-performers-map
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Google Maps
GOOGLE_MAPS_API_KEY=api_key

# File Upload
MAX_FILE_SIZE=100MB
UPLOAD_PATH=./uploads

# Cloudinary - REPLACE WITH YOUR ACTUAL VALUES
CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
CLOUDINARY_API_KEY=your-actual-api-key
CLOUDINARY_API_SECRET=your-actual-api-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

## 3. Replace Placeholder Values

Replace the following values with your actual Cloudinary credentials:

- `CLOUDINARY_CLOUD_NAME`: Your cloud name from the Cloudinary dashboard
- `CLOUDINARY_API_KEY`: Your API key from the Cloudinary dashboard  
- `CLOUDINARY_API_SECRET`: Your API secret from the Cloudinary dashboard

## 4. Restart Backend Server

After updating the `.env` file, restart your backend server:

```bash
cd apps/backend
pnpm run dev
```

## 5. Test Video Upload

1. Go to the Create Performance page
2. Navigate to Step 3 (Video Upload)
3. Try uploading a video file (MP4, MOV, AVI, or WebM under 30MB)
4. The video should now upload successfully to Cloudinary

## Development Mode

If Cloudinary is not configured, the system will automatically use mock video uploads for development. You'll see a warning in the backend console:

```
⚠️  Cloudinary not configured. Returning mock video upload result for development.
```

## Cloudinary Features Used

- **Video Upload**: Automatic optimization and format conversion
- **Thumbnails**: Auto-generated video thumbnails
- **Duration Limit**: 30 seconds max via transformation
- **Quality**: Auto-optimized for web delivery
- **Storage**: Organized in folders by user ID

## Troubleshooting

### 500 Error on Upload
- Check that all three Cloudinary environment variables are set
- Ensure values are not the placeholder values from `env.example`
- Restart the backend server after changing environment variables

### Invalid Credentials Error
- Double-check your Cloudinary credentials in the dashboard
- Make sure there are no extra spaces in the `.env` file
- Verify the API secret is correct (it's sensitive to copy/paste errors)

### Upload Timeout
- Check your internet connection
- Ensure the video file is under 30MB
- Try with a smaller video file first

## Free Tier Limits

Cloudinary free tier includes:
- 25 GB storage
- 25 GB monthly bandwidth
- 1,000 transformations per month

This should be sufficient for development and testing.
