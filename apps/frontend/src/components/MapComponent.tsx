import { useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import type { Performance } from '@spm/shared-types';
import { useLikePerformance } from '@/hooks/usePerformances';
import { useUser } from '@clerk/clerk-react';

interface MapComponentProps {
  userLocation: [number, number];
  performances: Performance[];
  filters: {
    genre: string;
    timeRange: string;
    distance: number;
    popularity: string;
  };
}

interface PerformanceMarkerProps {
  performance: Performance;
  onClick: () => void;
}

function PerformanceMarker({ performance, onClick }: PerformanceMarkerProps) {
  const currentStop = performance.route.stops.find(stop => stop.status === 'active') || performance.route.stops[0];
  const position = {
    lat: currentStop.location.coordinates[1],
    lng: currentStop.location.coordinates[0]
  };

  // Get status-based styling
  const getStatusColor = () => {
    switch (performance.status) {
      case 'live': return '#ef4444'; // red
      case 'scheduled': return '#3b82f6'; // blue
      case 'completed': return '#6b7280'; // gray
      default: return '#8b5cf6'; // purple
    }
  };

  const getGenreIcon = () => {
    switch (performance.genre) {
      case 'jazz': return '🎷';
      case 'rock': return '🎸';
      case 'classical': return '🎻';
      case 'pop': return '🎤';
      case 'folk': return '🪕';
      case 'blues': return '🎵';
      default: return '🎭';
    }
  };

  return (
    <AdvancedMarker
      position={position}
      onClick={onClick}
      title={`${performance.title} - ${performance.genre}`}
    >
      <div 
        style={{
          backgroundColor: getStatusColor(),
          color: 'white',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          border: '3px solid white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {getGenreIcon()}
      </div>
    </AdvancedMarker>
  );
}

export function MapComponent({ userLocation, performances, filters }: MapComponentProps) {
  const { isSignedIn } = useUser();
  const likePerformanceMutation = useLikePerformance();
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null);
  const [mapCenter, setMapCenter] = useState({
    lat: userLocation[1],
    lng: userLocation[0]
  });

  // Filter performances based on current filters
  const filteredPerformances = performances.filter(performance => {
    // Genre filter
    if (filters.genre !== 'all' && performance.genre !== filters.genre) {
      return false;
    }
    
    // Time filter
    if (filters.timeRange === 'now' && performance.status !== 'live') {
      return false;
    }
    
    // Distance filter (simple calculation for demo)
    const performanceLocation = performance.route.stops[0].location.coordinates;
    const distance = Math.sqrt(
      Math.pow(performanceLocation[0] - userLocation[0], 2) + 
      Math.pow(performanceLocation[1] - userLocation[1], 2)
    ) * 111; // Rough km conversion
    
    if (distance > filters.distance) {
      return false;
    }
    
    return true;
  });

  const handleMarkerClick = useCallback((performance: Performance) => {
    setSelectedPerformance(performance);
    const currentStop = performance.route.stops.find(stop => stop.status === 'active') || performance.route.stops[0];
    setMapCenter({
      lat: currentStop.location.coordinates[1],
      lng: currentStop.location.coordinates[0]
    });
  }, []);

  const handleLikePerformance = useCallback(async (performanceId: string) => {
    if (!isSignedIn) {
      alert('Please log in to like performances!');
      return;
    }

    try {
      await likePerformanceMutation.mutateAsync(performanceId);
    } catch (error) {
      console.error('Failed to like performance:', error);
      alert('Failed to like performance. Please try again.');
    }
  }, [isSignedIn, likePerformanceMutation]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getStatusText = (performance: Performance) => {
    const currentStop = performance.route.stops.find(stop => stop.status === 'active') || performance.route.stops[0];
    
    switch (performance.status) {
      case 'live':
        return `Live Now • Ends at ${formatTime(new Date(currentStop.endTime))}`;
      case 'scheduled':
        const startTime = new Date(currentStop.startTime);
        const minutesUntil = Math.round((startTime.getTime() - Date.now()) / (1000 * 60));
        if (minutesUntil < 60) {
          return `Starting in ${minutesUntil} minutes`;
        }
        return `Today at ${formatTime(startTime)}`;
      default:
        return 'Scheduled';
    }
  };

  // Get Google Maps API key from environment variables
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here') {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Google Maps Integration</h3>
          <p className="text-gray-600 mb-4">
            To see the interactive map, you need to add a Google Maps API key.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-left">
            <p className="text-sm text-gray-700 mb-2">Add to your .env file:</p>
            <code className="text-xs bg-gray-200 p-2 rounded block">
              VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
            </code>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Get your free API key at: console.cloud.google.com
          </p>
          
          {/* Mock Performance List */}
          <div className="mt-6 space-y-2">
            <h4 className="font-semibold text-gray-900">Nearby Performances:</h4>
            {filteredPerformances.map(performance => (
              <div key={performance._id} className="p-3 bg-gray-50 rounded-lg text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-gray-900">{performance.title}</h5>
                    <p className="text-sm text-gray-600">{performance.route.stops[0].location.name}</p>
                    <p className="text-sm text-gray-500">{getStatusText(performance)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`status-${performance.status === 'live' ? 'live' : performance.status === 'scheduled' ? 'scheduled' : 'soon'}`}>
                      {performance.status === 'live' ? 'LIVE' : 'SOON'}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">{performance.engagement.likes} ❤️</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Map
        center={mapCenter}
        zoom={14}
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="h-full w-full"
        mapId="street-performers-map"
        mapTypeControl={true}
        zoomControl={true}
        streetViewControl={false}
        fullscreenControl={true}
        clickableIcons={false}
      >
        {/* User Location Marker */}
        <AdvancedMarker
          position={{ lat: userLocation[1], lng: userLocation[0] }}
          title="Your Location"
        >
          <div 
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              border: '3px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              animation: 'pulse 2s infinite'
            }}
          >
            📍
          </div>
        </AdvancedMarker>

        {/* Performance Markers */}
        {filteredPerformances.map(performance => (
          <PerformanceMarker
            key={performance._id}
            performance={performance}
            onClick={() => handleMarkerClick(performance)}
          />
        ))}

        {/* Info Window for Selected Performance */}
        {selectedPerformance && (
          <InfoWindow
            position={{
              lat: selectedPerformance.route.stops[0].location.coordinates[1],
              lng: selectedPerformance.route.stops[0].location.coordinates[0]
            }}
            onCloseClick={() => setSelectedPerformance(null)}
          >
            <div className="p-6 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{selectedPerformance.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedPerformance.status === 'live' ? 'bg-red-100 text-red-800' :
                  selectedPerformance.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {getStatusText(selectedPerformance)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{selectedPerformance.description}</p>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">🎵</span>
                  <span className="capitalize font-medium">{selectedPerformance.genre}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">📍</span>
                  <span className="text-gray-700">{selectedPerformance.route.stops[0].location.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">❤️</span>
                  <span className="text-gray-700">{selectedPerformance.engagement.likes} likes</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button 
                  onClick={() => handleLikePerformance(selectedPerformance._id)}
                  disabled={likePerformanceMutation.isPending}
                  className="flex-1 text-sm px-4 py-2 transition-colors btn-primary disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  {likePerformanceMutation.isPending ? (
                    <>
                      <span>⏳</span>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>❤️</span>
                      <span>Like ({selectedPerformance.engagement.likes})</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    const currentStop = selectedPerformance.route.stops.find(stop => stop.status === 'active') || selectedPerformance.route.stops[0];
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${currentStop.location.coordinates[1]},${currentStop.location.coordinates[0]}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 text-sm px-4 py-2 transition-colors btn-secondary flex items-center justify-center space-x-1"
                >
                  <span>🧭</span>
                  <span>Directions</span>
                </button>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
