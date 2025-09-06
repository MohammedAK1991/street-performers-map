import React from 'react';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string;
  onClose?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  title,
  onClose,
}) => {
  return (
    <div className="relative">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-all"
          aria-label="Close video"
        >
          ✕
        </button>
      )}
      
      {/* Video title */}
      {title && (
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      
      {/* Video player */}
      <div className="relative rounded-lg overflow-hidden bg-black" style={{ width: '100%', height: '200px' }}>
        <ReactPlayer
          url={videoUrl}
          controls
          width="100%"
          height="200px"
          light={thumbnailUrl} // Use thumbnail as poster image
          playing={false} // Don't autoplay
          config={{
            file: {
              attributes: {
                preload: 'metadata',
              },
            },
          }}
          style={{
            borderRadius: '8px',
          }}
        />
      </div>
      
      {/* Video info */}
      <div className="mt-2 text-sm text-gray-600">
        <p>Click to play video</p>
      </div>
    </div>
  );
};

export default VideoPlayer;
