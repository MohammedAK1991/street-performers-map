import { Link, useNavigate } from 'react-router-dom';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { useClerkAuthStore } from '@/stores/clerkAuthStore';

export function Home() {
  const { user: clerkUser, isSignedIn } = useUser();
  const { user: dbUser } = useClerkAuthStore();
  const navigate = useNavigate();

  // Determine if user is authenticated and their role
  const isAuthenticated = isSignedIn && !!clerkUser;
  const isPerformer = dbUser?.role === 'performer';
  const isAudience = dbUser?.role === 'audience';

  // Handler for "Get Started as Performer" button
  const handlePerformerAction = () => {
    if (!isAuthenticated) {
      // Not logged in - show signup modal
      return; // Clerk will handle the modal
    } else if (isPerformer) {
      // Already a performer - go to create performance
      navigate('/create-performance');
    } else if (isAudience) {
      // Is audience - redirect to role selection
      navigate('/role-selection');
    } else {
      // No role set yet - redirect to role selection
      navigate('/role-selection');
    }
  };

  // Handler for "Discover Music" button - always go to map
  const handleDiscoverMusic = () => {
    navigate('/map');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-purple-600">
                🎵 StreetPerformersMap
              </h1>
            </div>
            <div className="flex space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Welcome, {clerkUser?.fullName || clerkUser?.username || 'User'}!
                  </span>
                  <Link to="/map" className="btn-secondary">View Map</Link>
                  <UserButton afterSignOutUrl="/" />
                </div>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="btn-secondary">Login</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="btn-primary">Sign Up</button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Debug Section - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Debug Info:</strong><br/>
                Clerk Authenticated: {isSignedIn ? 'true' : 'false'}<br/>
                Clerk User: {clerkUser ? clerkUser.fullName || clerkUser.username : 'null'}<br/>
                Clerk User ID: {clerkUser?.id || 'null'}<br/>
                DB User: {dbUser ? dbUser.profile?.displayName || dbUser.username : 'null'}<br/>
                DB User Role: {dbUser?.role || 'null'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🎸 Discover Live Street Music Around You 🎸
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Connect performers with audiences in real-time. Find amazing live performances happening nearby or share your music with the world.
          </p>

          {/* User Type Selection */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Performers</h3>
              <ul className="text-gray-600 mb-6 space-y-2">
                <li>• Set your performance route</li>
                <li>• Upload videos to showcase your talent</li>
                <li>• Build your audience and earn tips</li>
                <li>• Track your performance analytics</li>
              </ul>
               {isAuthenticated ? (
                 <button 
                   onClick={handlePerformerAction} 
                   className="btn-primary w-full"
                 >
                   {isPerformer ? 'Create Performance' : 'Get Started as Performer'}
                 </button>
               ) : (
                 <SignUpButton mode="modal">
                   <button className="btn-primary w-full">
                     Get Started as Performer
                   </button>
                 </SignUpButton>
               )}
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Music Lovers</h3>
              <ul className="text-gray-600 mb-6 space-y-2">
                <li>• Find live performances near you</li>
                <li>• Support your favorite artists</li>
                <li>• Discover new music and genres</li>
                <li>• Get notified of upcoming shows</li>
              </ul>
               {isAuthenticated ? (
                 <button 
                   onClick={handleDiscoverMusic} 
                   className="btn-primary w-full"
                 >
                   Discover Music
                 </button>
               ) : (
                 <SignUpButton mode="modal">
                   <button className="btn-primary w-full">
                     Discover Music
                   </button>
                 </SignUpButton>
               )}
            </div>
          </div>

          {/* Quick Access to Map */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 max-w-md mx-auto">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Explore Map</h3>
            <p className="text-gray-600 mb-6">See what's happening right now</p>
            <Link to="/map" className="btn-secondary w-full block text-center">View Live Map</Link>
          </div>
        </div>

        {/* Featured Performances */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            🌟 Featured Today 🌟
          </h2>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="status-live">LIVE</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Jazz Trio at Central Park</h4>
                    <p className="text-gray-600">📍 Bethesda Fountain • Ends at 3:30 PM</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">127 ❤️</p>
                  <p className="text-sm text-gray-500">89 watching</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="status-soon">SOON</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Street Guitar at Times Square</h4>
                    <p className="text-gray-600">📍 Red Steps • Starting in 15 minutes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">89 ❤️</p>
                  <p className="text-sm text-gray-500">23 interested</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="status-scheduled">TODAY</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Folk Singer at Brooklyn Bridge</h4>
                    <p className="text-gray-600">📍 Bridge Park • 2:30 PM Today</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">45 ❤️</p>
                  <p className="text-sm text-gray-500">12 interested</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 text-center text-gray-500">
          <p>&copy; 2024 StreetPerformersMap. Made with ❤️ for the street music community.</p>
        </footer>
      </main>
    </div>
  );
}