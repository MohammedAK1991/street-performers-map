import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import type { Video } from '@spm/shared-types';

// Hook to check upload eligibility
export const useUploadEligibility = () => {
  return useQuery({
    queryKey: ['upload-eligibility'],
    queryFn: async () => {
      try {
        const response = await api.get('/media/videos/upload-eligibility');
        return response.data.data;
      } catch (error) {
        // Return default eligibility if endpoint doesn't exist
        console.warn('Upload eligibility endpoint not available, using defaults');
        return {
          canUpload: true,
          remainingUploads: 10,
          dailyLimit: 10,
          todayCount: 0,
          maxFileSize: 30 * 1024 * 1024, // 30MB
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry on 404 errors
  });
};

// Hook to upload video
export const useVideoUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, performanceId }: { file: File; performanceId?: string }) => {
      const formData = new FormData();
      formData.append('video', file);
      if (performanceId) {
        formData.append('performanceId', performanceId);
      }

      const response = await api.post('/media/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data as Video;
    },
    onSuccess: () => {
      // Invalidate and refetch video-related queries
      queryClient.invalidateQueries({ queryKey: ['upload-eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['my-videos'] });
      queryClient.invalidateQueries({ queryKey: ['video-analytics'] });
    },
  });
};

// Hook to get user's videos
export const useMyVideos = () => {
  return useQuery({
    queryKey: ['my-videos'],
    queryFn: async () => {
      const response = await api.get('/media/videos/my-videos');
      return response.data.data as Video[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Hook to link video to performance
export const useLinkVideoToPerformance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, performanceId }: { videoId: string; performanceId: string }) => {
      const response = await api.patch(`/media/videos/${videoId}/link-performance`, {
        performanceId,
      });
      return response.data.data as Video;
    },
    onSuccess: () => {
      // Refresh video-related queries
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['performances'] });
    },
  });
};

// Hook to refresh video data
export const useRefreshVideoData = () => {
  const queryClient = useQueryClient();

  const refreshMyVideos = () => {
    queryClient.invalidateQueries({ queryKey: ['my-videos'] });
  };

  const refreshUploadEligibility = () => {
    queryClient.invalidateQueries({ queryKey: ['upload-eligibility'] });
  };

  return {
    refreshMyVideos,
    refreshUploadEligibility,
  };
};