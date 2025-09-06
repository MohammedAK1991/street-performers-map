import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

// Hook to check upload eligibility
export const useUploadEligibility = () => {
  return useQuery({
    queryKey: ['upload-eligibility'],
    queryFn: async () => {
      try {
        const response = await api.get('/media/upload-eligibility');
        return response.data;
      } catch (error) {
        // Return default eligibility if endpoint doesn't exist
        console.warn('Upload eligibility endpoint not available, using defaults');
        return {
          canUpload: true,
          remainingUploads: 10,
          maxFileSize: 100 * 1024 * 1024, // 100MB
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry on 404 errors
  });
};

// Hook to refresh video data
export const useRefreshVideoData = () => {
  const queryClient = useQueryClient();

  const refreshMyVideos = () => {
    queryClient.invalidateQueries({ queryKey: ['my-videos'] });
  };

  return {
    refreshMyVideos,
  };
};