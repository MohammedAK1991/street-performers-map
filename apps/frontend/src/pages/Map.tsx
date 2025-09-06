import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { MapComponent } from '@/components/MapComponent';
import { FilterPanel } from '@/components/FilterPanel';
import { PerformanceList } from '@/components/PerformanceList';
import { useNearbyPerformances } from '@/hooks/usePerformances';
import type { PerformanceFilters } from '@spm/shared-types';


export function Map() {
  const { user: clerkUser, isSignedIn } = useUser();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);
  const [filters, setFilters] = useState({
    genre: 'all',
    timeRange: 'now',
    distance: 5,
    popularity: 'all'
  });

  // Convert filters for API
  const apiFilters: PerformanceFilters = useMemo(() => ({
    ...(filters.genre !== 'all' && { genre: filters.genre }),
    ...(filters.timeRange === 'now' && { status: 'live' as const }),
  }), [filters]);

  // Fetch nearby performances using real API
  const { data: nearbyPerformances = [], isLoading: performancesLoading, error: performancesError } = useNearbyPerformances(
    userLocation ? { lat: userLocation[1], lng: userLocation[0] } : { lat: 40.7831, lng: -73.9712 }, // Default NYC
    filters.distance,
    apiFilters
  );

  // Use real data from backend
  const performances = nearbyPerformances;

  // Request location permission
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
          setLocationPermission('granted');
        },
        (error) => {
          console.error('Location error:', error);
          setLocationPermission('denied');
          // Default to NYC for demo
          setUserLocation([-73.9712, 40.7831]);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setLocationPermission('denied');
      setUserLocation([-73.9712, 40.7831]); // Default to NYC
    }
  }, []);

  // Enhanced loading state with performance feedback
  if (!userLocation || performancesLoading) {
    const loadingSteps = [
      { step: 1, label: 'Getting your location...', complete: !!userLocation },
      { step: 2, label: 'Loading nearby performances...', complete: !performancesLoading && !!userLocation },
      { step: 3, label: 'Preparing map...', complete: !performancesLoading && !!userLocation }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6 animate-bounce">🎵</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Loading StreetPerformersMap</h2>
          
          {/* Loading steps */}
          <div className="space-y-4 mb-6">
            {loadingSteps.map(({ step, label, complete }) => (
              <div key={step} className="flex items-center justify-center space-x-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  complete 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : step <= 2 ? 'border-purple-500 text-purple-500' : 'border-gray-300 text-gray-300'
                }`}>
                  {complete ? '✓' : step}
                </div>
                <span className={`text-sm ${complete ? 'text-green-600' : 'text-gray-600'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Error handling */}
          {performancesError && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                Unable to load live performances. Showing demo data.
              </p>
            </div>
          )}
          
          {locationPermission === 'denied' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm mb-3">
                Location access denied. You can still browse the map!
              </p>
              <button 
                onClick={() => setUserLocation([-73.9712, 40.7831])}
                className="btn-primary text-sm"
              >
                📍 Continue with New York City
              </button>
            </div>
          )}

          {/* Quick stats during loading */}
          <div className="mt-8 text-sm text-gray-500">
            <p>🎭 Connecting street performers worldwide</p>
            <p>🌍 Real-time performance discovery</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 z-20">
        <div className="px-4 sm:px-6 lg:px-8 max-w-full">
          <div className="flex justify-between items-center h-16 min-w-0">
            <div className="flex items-center space-x-4 lg:space-x-6 min-w-0 flex-1">
              <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-purple-600 hover:text-purple-700 transition-colors">
                <span className="text-2xl">🎵</span>
                <span>StreetPerformersMap</span>
              </Link>
              
              {/* Search Bar */}
              <div className="hidden lg:block">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search performances..."
                    className="w-64 xl:w-80 px-4 py-2 pl-10 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  showFilters 
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-200' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">🎭</span>
                Filters
              </button>
              
              {/* List Toggle */}
              <button
                onClick={() => setShowList(!showList)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  showList 
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-200' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">📋</span>
                List
              </button>
              
              {/* User Menu */}
              {isSignedIn ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 hidden sm:block">
                    Welcome, <span className="font-medium">{clerkUser?.fullName || clerkUser?.username}</span>!
                  </span>
                  <Link to="/create-performance" className="btn-primary flex items-center space-x-2">
                    <span>➕</span>
                    <span className="hidden sm:inline">Create Performance</span>
                  </Link>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link to="/" className="btn-secondary">Go to Home</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Filter Panel */}
        {showFilters && (
          <div className="absolute top-0 left-0 z-20 w-80 h-full bg-white shadow-lg">
            <FilterPanel 
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Performance List */}
        {showList && (
          <div className="absolute top-0 right-0 z-20 w-80 h-full bg-white shadow-lg">
            <PerformanceList 
              performances={performances}
              onClose={() => setShowList(false)}
            />
          </div>
        )}

        {/* Map */}
        <div className="map-container">
          <MapComponent 
            userLocation={userLocation}
            performances={performances}
            filters={filters}
          />
        </div>

        {/* Quick Stats Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {performances.filter(p => p.status === 'live').length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Live Now</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {performances.filter(p => {
                      const today = new Date();
                      const perfDate = new Date(p.scheduledFor);
                      return perfDate.toDateString() === today.toDateString();
                    }).length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {performances.length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Nearby</div>
                </div>
              </div>
              
              {isSignedIn && (
                <Link to="/create-performance" className="btn-primary flex items-center space-x-2 px-6 py-3 rounded-full font-medium">
                  <span className="text-lg">➕</span>
                  <span>Create Performance</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
