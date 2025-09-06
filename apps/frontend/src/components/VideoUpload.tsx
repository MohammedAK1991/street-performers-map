import { useState, useRef } from 'react';
import type { Video } from '@spm/shared-types';

interface VideoUploadProps {
  eligibility?: {
    canUpload: boolean;
    remainingUploads: number;
    dailyLimit: number;
  };
  onUploadSuccess: (video: Video) => void;
  onUploadError: (error: string) => void;
  className?: string;
}

export function VideoUpload({ 
  eligibility, 
  onUploadSuccess, 
  onUploadError, 
  className = "" 
}: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi'];
    if (!allowedTypes.includes(file.type)) {
      onUploadError('Please select a valid video file (MP4, MOV, or AVI)');
      return;
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      onUploadError('File size must be less than 100MB');
      return;
    }

    // Validate duration (30 seconds max)
    // Note: In a real app, you'd need to check video duration
    // For now, we'll just proceed with the upload

    setIsUploading(true);
    onUploadError(''); // Clear any previous errors

    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mock video object
      const mockVideo: Video = {
        _id: `video_${Date.now()}`,
        userId: 'current-user-id', // Would be actual user ID
        performanceId: undefined, // Would be linked to performance
        cloudinaryPublicId: `video_${Date.now()}`,
        cloudinaryUrl: URL.createObjectURL(file), // Temporary URL for preview
        secureUrl: URL.createObjectURL(file), // Temporary URL for preview
        thumbnailUrl: '', // Would be generated on server
        filename: file.name,
        format: file.type.split('/')[1] || 'mp4',
        duration: 30, // Would be extracted from video
        size: file.size,
        width: 1080,
        height: 1920,
        uploadedAt: new Date(),
        status: 'processing',
        uploadDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        moderationStatus: 'pending',
        moderationReason: undefined,
        views: 0,
        totalWatchTime: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onUploadSuccess(mockVideo);
    } catch (error) {
      onUploadError('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const canUpload = eligibility?.canUpload ?? true;
  const remainingUploads = eligibility?.remainingUploads ?? 2;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-purple-400'
        } ${!canUpload ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => canUpload && fileInputRef.current?.click()}
      >
        <div className="text-4xl mb-4">🎥</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isUploading ? 'Uploading Video...' : 'Upload Performance Video'}
        </h3>
        <p className="text-gray-600 mb-4">
          Max 30 seconds, {remainingUploads} uploads remaining today
        </p>
        
        {isUploading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-sm text-gray-600">Processing video...</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={!canUpload}
            className="btn-primary"
          >
            📱 Choose Video File
          </button>
        )}
        
        <p className="text-xs text-gray-500 mt-4">
          Supported: MP4, MOV, AVI • Max size: 100MB
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/mov,video/avi"
        onChange={handleFileInput}
        className="hidden"
        disabled={!canUpload}
      />

      {/* Guidelines */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">🎬 Video Guidelines:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Show your performance style</li>
          <li>• Good lighting and clear audio</li>
          <li>• Vertical (9:16) format works best</li>
          <li>• Videos auto-delete after 24 hours</li>
        </ul>
      </div>

      {/* Mobile Upload Tip */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-700 mb-2">📱 Mobile Upload Tip:</p>
        <p className="text-xs text-gray-600">
          You can also upload directly from your phone at: <br />
          <strong>spm.app/upload</strong> (No app download needed!)
        </p>
      </div>
    </div>
  );
}