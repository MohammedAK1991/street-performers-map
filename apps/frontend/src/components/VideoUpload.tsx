import { useState, useRef } from 'react';
import type { Video } from '@spm/shared-types';
import { useVideoUpload } from '@/hooks/useVideoUpload';

interface VideoUploadProps {
  eligibility?: {
    canUpload: boolean;
    remainingUploads: number;
    dailyLimit: number;
  };
  performanceId?: string;
  onUploadSuccess: (video: Video) => void;
  onUploadError: (error: string) => void;
  className?: string;
}

export function VideoUpload({ 
  eligibility, 
  performanceId,
  onUploadSuccess, 
  onUploadError, 
  className = "" 
}: VideoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useVideoUpload();

  console.log('eligibility', eligibility);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      onUploadError('Please select a valid video file (MP4, MOV, AVI, or WebM)');
      return;
    }

    // Validate file size (30MB max as per backend)
    const maxSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSize) {
      onUploadError('File size must be less than 30MB');
      return;
    }

    onUploadError(''); // Clear any previous errors

    try {
      const video = await uploadMutation.mutateAsync({ 
        file, 
        performanceId 
      });
      
      onUploadSuccess(video);
    } catch (error: any) {
      console.error('Video upload error:', error);
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.message || 
                          'Failed to upload video. Please try again.';
      onUploadError(errorMessage);
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

  const canUpload = true
  // const canUpload = eligibility?.canUpload ?? true;
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
          {uploadMutation.isPending ? 'Uploading Video...' : 'Upload Performance Video'}
        </h3>
        <p className="text-gray-600 mb-4">
          Max 30 seconds, {remainingUploads} uploads remaining today
        </p>
        
        {uploadMutation.isPending ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-sm text-gray-600">Uploading to Cloudinary...</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={!canUpload || uploadMutation.isPending}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📱 Choose Video File
          </button>
        )}
        
        <p className="text-xs text-gray-500 mt-4">
          Supported: MP4, MOV, AVI, WebM • Max size: 30MB
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
        onChange={handleFileInput}
        className="hidden"
        disabled={!canUpload || uploadMutation.isPending}
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