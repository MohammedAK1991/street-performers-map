import mongoose, { Schema, Document } from 'mongoose';
// Base entity interface
interface BaseEntity {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideo extends BaseEntity {
  // Ownership
  userId: string;
  performanceId?: string;
  
  // Cloudinary details
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  secureUrl: string;
  thumbnailUrl: string;
  
  // File metadata
  filename: string;
  format: string;
  duration?: number;
  size: number;
  width?: number;
  height?: number;
  
  // Upload metadata
  uploadedAt: Date;
  status: 'processing' | 'ready' | 'failed';
  
  // Daily limit tracking
  uploadDate: string; // YYYY-MM-DD format for easy querying
  
  // Content moderation
  moderationStatus: 'pending' | 'approved' | 'rejected';
  moderationReason?: string;
  
  // Analytics
  views: number;
  totalWatchTime: number; // in seconds
  
  // Auto-deletion (24 hours)
  expiresAt: Date;
}

export interface VideoDocument extends IVideo, Document {}

const VideoSchema = new Schema<VideoDocument>(
  {
    // Ownership
    userId: {
      type: String,
      required: true,
      index: true,
    },
    performanceId: {
      type: String,
      index: true,
    },
    
    // Cloudinary details
    cloudinaryPublicId: {
      type: String,
      required: true,
      unique: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    secureUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    
    // File metadata
    filename: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
    },
    size: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    
    // Upload metadata
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
      index: true,
    },
    
    // Daily limit tracking
    uploadDate: {
      type: String,
      required: true,
      index: true,
    },
    
    // Content moderation
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    moderationReason: {
      type: String,
    },
    
    // Analytics
    views: {
      type: Number,
      default: 0,
    },
    totalWatchTime: {
      type: Number,
      default: 0,
    },
    
    // Auto-deletion (24 hours from upload)
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
    collection: 'videos',
  }
);

// Compound indexes for efficient queries
VideoSchema.index({ userId: 1, uploadDate: 1 }); // Daily limit check
VideoSchema.index({ performanceId: 1, status: 1 }); // Performance videos
VideoSchema.index({ status: 1, moderationStatus: 1 }); // Moderation queue
VideoSchema.index({ expiresAt: 1 }); // TTL cleanup

// Virtual for checking if video is expired
VideoSchema.virtual('isExpired').get(function(this: VideoDocument) {
  return new Date() > this.expiresAt;
});

// Methods
VideoSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

VideoSchema.methods.updateWatchTime = function(seconds: number) {
  this.totalWatchTime += seconds;
  return this.save();
};

VideoSchema.methods.approve = function() {
  this.moderationStatus = 'approved';
  return this.save();
};

VideoSchema.methods.reject = function(reason: string) {
  this.moderationStatus = 'rejected';
  this.moderationReason = reason;
  return this.save();
};

// Static methods
VideoSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId, status: 'ready', moderationStatus: 'approved' })
    .sort({ uploadedAt: -1 });
};

VideoSchema.statics.findByPerformance = function(performanceId: string) {
  return this.find({ 
    performanceId, 
    status: 'ready', 
    moderationStatus: 'approved' 
  }).sort({ uploadedAt: -1 });
};

VideoSchema.statics.getUserDailyCount = function(userId: string, date: string) {
  return this.countDocuments({ userId, uploadDate: date });
};

VideoSchema.statics.findExpiredVideos = function() {
  return this.find({ 
    expiresAt: { $lt: new Date() },
    status: { $ne: 'failed' }
  });
};

export const Video = mongoose.model<VideoDocument>('Video', VideoSchema);