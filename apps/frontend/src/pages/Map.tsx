import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { MapComponent } from '@/components/MapComponent';
import { FilterPanel } from '@/components/FilterPanel';
import { PerformanceList } from '@/components/PerformanceList';
import { useNearbyPerformances } from '@/hooks/usePerformances';
import type { PerformanceFilters } from '@spm/shared-types';

// Mock data for development
const mockPerformances = [
  {
    _id: '1',
    performerId: 'performer1',
    title: 'Jazz by the Fountain',
    description: 'Smooth jazz classics and modern interpretations',
    genre: 'jazz',
    route: {
      stops: [{
        location: {
          coordinates: [-73.9712, 40.7831] as [number, number], // Central Park
          address: 'Bethesda Fountain, Central Park, NYC',
          name: 'Bethesda Fountain'
        },
        startTime: new Date('2024-01-15T14:00:00Z'),
        endTime: new Date('2024-01-15T15:30:00Z'),
        status: 'active' as const
      }]
    },
    videos: [],
    engagement: {
      likes: 127,
      views: 456,
      tips: 0,
      likedBy: []
    },
    status: 'live' as const,
    scheduledFor: new Date('2024-01-15T14:00:00Z'),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    _id: '2',
    performerId: 'performer2',
    title: 'Street Guitar Vibes',
    description: 'Acoustic covers and original songs',
    genre: 'rock',
    route: {
      stops: [{
        location: {
          coordinates: [-73.9857, 40.7484] as [number, number], // Times Square
          address: 'Times Square, NYC',
          name: 'Red Steps'
        },
        startTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        endTime: new Date(Date.now() + 90 * 60 * 1000), // 1.5 hours from now
        status: 'scheduled' as const
      }]
    },
    videos: [],
    engagement: {
      likes: 89,
      views: 234,
      tips: 0,
      likedBy: []
    },
    status: 'scheduled' as const,
    scheduledFor: new Date(Date.now() + 15 * 60 * 1000),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
];

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

  // Use real data when available, fallback to mock for demo
  const performances = nearbyPerformances.length > 0 ? nearbyPerformances : mockPerformances;

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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-xl font-bold text-purple-600">
                🎵 StreetPerformersMap
              </Link>
              
              {/* Search Bar */}
              <div className="hidden md:block">
                <input
                  type="text"
                  placeholder="Search performances..."
                  className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary"
              >
                🎭 Filters
              </button>
              
              {/* List Toggle */}
              <button
                onClick={() => setShowList(!showList)}
                className="btn-secondary"
              >
                📋 List
              </button>
              
              {/* User Menu */}
              {isSignedIn ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Welcome, {clerkUser?.fullName || clerkUser?.username}!</span>
                  <Link to="/create-performance" className="btn-primary">
                    Create Performance
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
              performances={mockPerformances}
              onClose={() => setShowList(false)}
            />
          </div>
        )}

        {/* Map */}
        <div className="h-full">
          <MapComponent 
            userLocation={userLocation}
            performances={mockPerformances}
            filters={filters}
          />
        </div>

        {/* Quick Stats Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex space-x-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {performances.filter(p => p.status === 'live').length}
                  </div>
                  <div className="text-sm text-gray-600">Live Now</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {performances.filter(p => {
                      const today = new Date();
                      const perfDate = new Date(p.scheduledFor);
                      return perfDate.toDateString() === today.toDateString();
                    }).length}
                  </div>
                  <div className="text-sm text-gray-600">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {performances.length}
                  </div>
                  <div className="text-sm text-gray-600">Nearby</div>
                </div>
              </div>
              
              {isSignedIn && (
                <Link to="/create-performance" className="btn-primary">
                  ➕ Create Performance
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
