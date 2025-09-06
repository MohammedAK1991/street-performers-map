import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { MapComponent } from '@/components/MapComponent';
import { FilterPanel } from '@/components/FilterPanel';
import { PerformanceList } from '@/components/PerformanceList';
import { PerformanceModal } from '@/components/PerformanceModal';
import { useNearbyPerformances } from '@/hooks/usePerformances';
import { Search, Filter, List, Plus, MapPin } from 'lucide-react';
import type { PerformanceFilters, Performance } from '@spm/shared-types';


export function Map() {
  const { user: clerkUser, isSignedIn } = useUser();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    genre: 'all',
    timeRange: 'all',
    distance: 25,
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

  // Modal handlers
  const handlePerformanceClick = (performance: Performance) => {
    setSelectedPerformance(performance);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPerformance(null);
  };

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6 animate-bounce">🎵</div>
          <h2 className="text-3xl font-bold text-foreground mb-6">Loading StreetPerformersMap</h2>
          
          {/* Loading steps */}
          <div className="space-y-4 mb-6">
            {loadingSteps.map(({ step, label, complete }) => (
              <div key={step} className="flex items-center justify-center space-x-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  complete 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : step <= 2 ? 'border-primary text-primary' : 'border-muted text-muted-foreground'
                }`}>
                  {complete ? '✓' : step}
                </div>
                <span className={`text-sm ${complete ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Error handling */}
          {performancesError && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm">
                Unable to load live performances. Showing demo data.
              </p>
            </div>
          )}
          
          {locationPermission === 'denied' && (
            <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-primary text-sm mb-3">
                Location access denied. You can still browse the map!
              </p>
              <button 
                onClick={() => setUserLocation([-73.9712, 40.7831])}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm transition-colors"
              >
                📍 Continue with New York City
              </button>
            </div>
          )}

          {/* Quick stats during loading */}
          <div className="mt-8 text-sm text-muted-foreground">
            <p>🎭 Connecting street performers worldwide</p>
            <p>🌍 Real-time performance discovery</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm shadow-lg border-b border-border z-20">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-foreground hover:text-primary transition-colors">
                <div className="w-8 h-8 rounded-full street-gradient flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span>StreetPerformersMap</span>
              </Link>
              
              {/* Search Bar */}
              <div className="hidden md:block">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search performances..."
                    className="w-80 px-4 py-2 pl-10 bg-card border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  showFilters 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card text-foreground border border-border hover:bg-muted'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              
              {/* List Toggle */}
              <button
                onClick={() => setShowList(!showList)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  showList 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card text-foreground border border-border hover:bg-muted'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
              
              {/* User Menu */}
              {isSignedIn ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    Welcome, <span className="font-medium text-foreground">{clerkUser?.fullName || clerkUser?.username}</span>!
                  </span>
                  <Link to="/create-performance" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Performance</span>
                  </Link>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link to="/" className="bg-card hover:bg-muted text-foreground border border-border px-4 py-2 rounded-lg font-medium transition-colors">Go to Home</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map */}
        <div className="h-full w-full overflow-hidden relative">
          <MapComponent 
            userLocation={userLocation}
            performances={performances}
            filters={filters}
            onPerformanceClick={handlePerformanceClick}
          />
          
          {/* Filter Panel (when showFilters is true) */}
          {showFilters && (
            <div className="absolute top-4 left-4 z-10 bg-card border border-border rounded-lg shadow-lg p-4 w-80">
              <FilterPanel 
                filters={filters}
                onFiltersChange={setFilters}
                onClose={() => setShowFilters(false)}
              />
            </div>
          )}
          
          {/* Performances Panel (when showList is true) */}
          {showList && (
            <div className="absolute top-4 right-4 z-10 bg-card border border-border rounded-lg shadow-lg p-4 w-80">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">Performances</h3>
                <button
                  onClick={() => setShowList(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              
              {performances.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎭</div>
                  <p className="text-muted-foreground text-sm">
                    No performances found. Try adjusting your filters or check back later!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {performances.slice(0, 5).map((performance, index) => (
                    <div 
                      key={performance._id || index}
                      className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handlePerformanceClick(performance)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground text-sm">{performance.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{performance.genre}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              performance.status === 'live' 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {performance.status === 'live' ? 'LIVE' : 'SCHEDULED'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {performance.engagement?.likes || 0} ❤️
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats Bar */}
        {/* <div className="absolute bottom-4 left-4 right-4 z-10">
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
        </div> */}
      </div>

      {/* Performance Modal */}
      {selectedPerformance && (
        <PerformanceModal
          performance={selectedPerformance}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
