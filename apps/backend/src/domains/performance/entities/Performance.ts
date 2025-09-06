import mongoose, { Schema, Document } from 'mongoose';
import type { Performance as IPerformance } from '@spm/shared-types';

// Mongoose document interface
export interface PerformanceDocument extends Omit<IPerformance, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Performance schema
const performanceSchema = new Schema<PerformanceDocument>(
  {
    performerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    genre: {
      type: String,
      enum: [
        'rock',
        'jazz',
        'folk',
        'pop',
        'classical',
        'blues',
        'country',
        'electronic',
        'hip-hop',
        'reggae',
        'other',
      ],
      required: true,
      index: true,
    },
    route: {
      stops: {
        type: [
          {
            location: {
              coordinates: {
                type: [Number, Number],
                required: true,
                index: '2dsphere',
              },
              address: {
                type: String,
                required: true,
              },
              name: String,
            },
            startTime: {
              type: Date,
              required: true,
            },
            endTime: {
              type: Date,
              required: true,
            },
            status: {
              type: String,
              enum: ['scheduled', 'active', 'completed', 'cancelled'],
              default: 'scheduled',
            },
          },
        ],
        validate: {
          validator: function(stops: any[]) {
            return stops.length >= 1 && stops.length <= 5;
          },
          message: 'Performance must have between 1 and 5 stops',
        },
      },
    },
    videos: [
      {
        url: {
          type: String,
          required: true,
        },
        thumbnail: {
          type: String,
          required: true,
        },
        duration: {
          type: Number,
          required: true,
          min: 1,
          max: 30, // 30 seconds max
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    engagement: {
      likes: {
        type: Number,
        default: 0,
      },
      views: {
        type: Number,
        default: 0,
      },
      tips: {
        type: Number,
        default: 0,
      },
      likedBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index for auto-deletion
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: any) => {
        ret._id = ret._id.toString();
        ret.performerId = ret.performerId.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
performanceSchema.index({ performerId: 1, createdAt: -1 });
performanceSchema.index({ status: 1, scheduledFor: 1 });
performanceSchema.index({ 'route.stops.location.coordinates': '2dsphere' });
performanceSchema.index({ genre: 1, status: 1 });
performanceSchema.index({ expiresAt: 1 }); // TTL index

// Compound index for geospatial queries with status
performanceSchema.index({ 
  'route.stops.location.coordinates': '2dsphere',
  status: 1,
  scheduledFor: 1 
});

// Virtual for current active stop
performanceSchema.virtual('currentStop').get(function() {
  const now = new Date();
  return this.route.stops.find(stop => 
    stop.status === 'active' || 
    (stop.startTime <= now && stop.endTime >= now)
  ) || this.route.stops[0];
});

// Method to check if performance is currently live
performanceSchema.methods.isLive = function() {
  const now = new Date();
  return this.route.stops.some(stop => 
    stop.startTime <= now && stop.endTime >= now
  );
};

// Method to get next stop
performanceSchema.methods.getNextStop = function() {
  const now = new Date();
  return this.route.stops.find(stop => stop.startTime > now);
};

export const PerformanceModel = mongoose.model<PerformanceDocument>('Performance', performanceSchema);
