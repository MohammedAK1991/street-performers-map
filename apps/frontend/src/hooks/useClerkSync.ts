import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

export const useClerkSync = () => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  useEffect(() => {
    if (clerkLoaded && clerkUser) {
      console.log('Clerk user loaded:', {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        username: clerkUser.username,
        displayName: clerkUser.fullName || clerkUser.username,
        avatar: clerkUser.imageUrl,
      });
    }
  }, [clerkUser, clerkLoaded]);

  return {
    isLoaded: clerkLoaded,
    isLoading: !clerkLoaded,
    error: null,
  };
};