import React from 'react';
import type { Performance } from '@spm/shared-types';
import { useLikePerformance } from '@/hooks/usePerformances';
import { useUser } from '@clerk/clerk-react';

interface PerformanceModalProps {
  performance: Performance;
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceModal: React.FC<PerformanceModalProps> = ({
  performance,
  isOpen,
  onClose,
}) => {
  const { user } = useUser();
  const likePerformanceMutation = useLikePerformance();
  
  // Check if current user has liked this performance
  const isLiked = user && performance.engagement.likedBy.includes(user.id);

  const handleLikePerformance = async (performanceId: string) => {
    try {
      await likePerformanceMutation.mutateAsync(performanceId);
    } catch (error) {
      console.error('Failed to like performance:', error);
    }
  };

  const getStatusText = (perf: Performance) => {
    switch (perf.status) {
      case 'live': return 'LIVE NOW';
      case 'scheduled': return 'UPCOMING';
      case 'completed': return 'FINISHED';
      default: return 'UNKNOWN';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{performance.title}</h2>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
              performance.status === 'live' ? 'bg-red-100 text-red-800' :
              performance.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {getStatusText(performance)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold ml-4"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Video Player */}
          {performance.videoUrl && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Video</h3>
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <video
                  controls
                  autoPlay
                  muted
                  poster={performance.videoThumbnail}
                  className="w-full h-full object-cover"
                  style={{ height: '400px' }}
                >
                  <source src={performance.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}

          {/* Description */}
          {performance.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-700 leading-relaxed">{performance.description}</p>
            </div>
          )}

          {/* Performance Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Details</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500">🎵</span>
                  <span className="capitalize font-medium text-gray-900">{performance.genre}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500">📍</span>
                  <span className="text-gray-700">{performance.route.stops[0].location.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500">📅</span>
                  <span className="text-gray-700">
                    {new Date(performance.scheduledFor).toLocaleDateString()} at{' '}
                    {new Date(performance.scheduledFor).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Engagement</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500">❤️</span>
                  <span className="text-gray-700">{performance.engagement.likes} likes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500">👀</span>
                  <span className="text-gray-700">{performance.engagement.views} views</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500">💰</span>
                  <span className="text-gray-700">{performance.engagement.tips} tips</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button 
              onClick={() => handleLikePerformance(performance._id)}
              disabled={likePerformanceMutation.isPending}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 ${
                isLiked 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {likePerformanceMutation.isPending ? (
                <>
                  <span>⏳</span>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>{isLiked ? '💔' : '❤️'}</span>
                  <span>{isLiked ? 'Unlike' : 'Like'} ({performance.engagement.likes})</span>
                </>
              )}
            </button>
            <button 
              onClick={() => {
                const currentStop = performance.route.stops.find(stop => stop.status === 'active') || performance.route.stops[0];
                const url = `https://www.google.com/maps/dir/?api=1&destination=${currentStop.location.coordinates[1]},${currentStop.location.coordinates[0]}`;
                window.open(url, '_blank');
              }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <span>🧭</span>
              <span>Get Directions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceModal;
