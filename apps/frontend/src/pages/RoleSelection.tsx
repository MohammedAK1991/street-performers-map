import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useClerkAuthStore } from '@/stores/clerkAuthStore';

export function RoleSelection() {
  const { user: clerkUser } = useUser();
  const { syncUserWithBackend } = useClerkAuthStore();
  const [selectedRole, setSelectedRole] = useState<'performer' | 'audience' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelection = async (role: 'performer' | 'audience') => {
    setSelectedRole(role);
    setIsLoading(true);
    setError(null);

    try {
      // Sync user with backend and set their role
      await syncUserWithBackend({
        id: clerkUser!.id,
        email: clerkUser!.primaryEmailAddress?.emailAddress || '',
        username: clerkUser!.username,
        displayName: clerkUser!.fullName || clerkUser!.username || 'User',
        avatar: clerkUser!.imageUrl,
        role: role, // Add role to the sync data
      });

      // Force refresh the page to reload the app state
      window.location.href = '/map';
    } catch (error) {
      console.error('Failed to sync user with backend:', error);
      setError('Failed to save your role. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 flex items-center justify-center py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎵</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to StreetPerformersMap!
            </h1>
            <p className="text-gray-600">
              Hi {clerkUser?.fullName || clerkUser?.username}! Let's get you set up.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              How would you like to use the app?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Performer Option */}
              <div 
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedRole === 'performer' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => !isLoading && setSelectedRole('performer')}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🎭</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">I'm a Performer</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    I want to share my music and perform on the streets
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1 text-left">
                    <li>• Create performance routes</li>
                    <li>• Upload performance videos</li>
                    <li>• Build an audience</li>
                    <li>• Earn tips from fans</li>
                  </ul>
                </div>
              </div>

              {/* Audience Option */}
              <div 
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedRole === 'audience' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => !isLoading && setSelectedRole('audience')}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">👥</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">I'm a Music Lover</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    I want to discover live performances near me
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1 text-left">
                    <li>• Find live performances</li>
                    <li>• Support local artists</li>
                    <li>• Discover new music</li>
                    <li>• Get performance notifications</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {selectedRole && (
            <div className="text-center">
              <button
                onClick={() => handleRoleSelection(selectedRole)}
                disabled={isLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting up your account...
                  </>
                ) : (
                  `Continue as ${selectedRole === 'performer' ? 'Performer' : 'Music Lover'}`
                )}
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Don't worry, you can change your role later in settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
