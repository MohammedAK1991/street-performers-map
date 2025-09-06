import { useEffect, useRef } from 'react';

interface CloudinaryVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  controls?: boolean;
}

// Extract public ID from Cloudinary URL
const extractPublicId = (url: string): string => {
  try {
    // Handle different Cloudinary URL formats
    // Example: https://res.cloudinary.com/demo/video/upload/v1564685400/samples/elephants.mp4
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match) {
      const publicId = match[1];
      console.log('🎬 Extracted public ID:', publicId, 'from URL:', url);
      return publicId;
    }
    
    // Fallback: try to extract from the end of the URL
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const fallbackId = lastPart.replace(/\.[^.]+$/, ''); // Remove file extension
    console.log('🎬 Fallback public ID:', fallbackId, 'from URL:', url);
    return fallbackId;
  } catch (error) {
    console.error('❌ Error extracting public ID from URL:', url, error);
    return '';
  }
};

// Extract cloud name from Cloudinary URL
const extractCloudName = (url: string): string => {
  try {
    const match = url.match(/res\.cloudinary\.com\/([^\/]+)\//);
    return match ? match[1] : 'demo';
  } catch (error) {
    console.error('Error extracting cloud name from URL:', url, error);
    return 'demo';
  }
};

export const CloudinaryVideoPlayer: React.FC<CloudinaryVideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  width = 640,
  height = 400,
  controls = true,
}) => {
  const cloudinaryRef = useRef<any>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>();

  useEffect(() => {
    const initializePlayer = () => {
      // Check if Cloudinary is available
      if (typeof window === 'undefined' || !window.cloudinary) {
        console.error('Cloudinary Video Player not loaded');
        // Try again after a short delay
        setTimeout(initializePlayer, 500);
        return;
      }

      // Don't reinitialize if already done
      if (cloudinaryRef.current && playerRef.current) return;

      cloudinaryRef.current = window.cloudinary;
      
      const cloudName = extractCloudName(videoUrl);
      const publicId = extractPublicId(videoUrl);

      console.log('🎬 Initializing Cloudinary Video Player:', {
        cloudName,
        publicId,
        videoUrl,
      });

      if (videoRef.current && publicId) {
        try {
          playerRef.current = cloudinaryRef.current.videoPlayer(videoRef.current, {
            cloud_name: cloudName,
            controls: controls,
            fluid: true,
            autoplay: false,
            muted: false,
          });

          console.log('✅ Cloudinary Video Player initialized successfully');
        } catch (error) {
          console.error('❌ Error initializing Cloudinary Video Player:', error);
        }
      }
    };

    // Start initialization
    initializePlayer();

    // Cleanup function
    return () => {
      if (playerRef.current && typeof playerRef.current.dispose === 'function') {
        try {
          playerRef.current.dispose();
          playerRef.current = null;
        } catch (error) {
          console.error('Error disposing video player:', error);
        }
      }
    };
  }, [videoUrl, controls]);

  const publicId = extractPublicId(videoUrl);
  
  if (!publicId) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <p className="text-gray-600">Invalid video URL</p>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        data-cld-public-id={publicId}
        controls={controls}
        width={width}
        height={height}
        className="w-full h-full"
        poster={thumbnailUrl}
      />
    </div>
  );
};

export default CloudinaryVideoPlayer;

// Extend window type for TypeScript
declare global {
  interface Window {
    cloudinary: any;
  }
}