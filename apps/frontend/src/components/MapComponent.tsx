import { useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Performance } from '@spm/shared-types';
import { useUser } from '@clerk/clerk-react';
import { PerformanceModal } from './PerformanceModal';

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
      <div style={{ position: 'relative' }}>
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
        
        {/* Video indicator */}
        {performance.videoUrl && (
          <div 
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              border: '1px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
            title="Has video"
          >
            📹
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
}

export function MapComponent({ userLocation, performances, filters }: MapComponentProps) {
  console.log('performances', performances);
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setIsModalOpen(true);
    const currentStop = performance.route.stops.find(stop => stop.status === 'active') || performance.route.stops[0];
    setMapCenter({
      lat: currentStop.location.coordinates[1],
      lng: currentStop.location.coordinates[0]
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPerformance(null);
  }, []);


  const handleMyLocationClick = () => {
    setMapCenter({
      lat: userLocation[1],
      lng: userLocation[0]
    });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
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
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={mapCenter}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId="street-performers-map"
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={true}
          clickableIcons={true}
          style={{ width: '100%', height: '100%' }}
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

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
          {/* Current Location Button */}
          <button
            onClick={handleMyLocationClick}
            className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl"
            title="Go to my location"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Legend */}
        {/* <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">Performance Status</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
              <span className="text-gray-700">Live Now</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
              <span className="text-gray-700">Scheduled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow-sm"></div>
              <span className="text-gray-700">Completed</span>
            </div>
            <div className="flex items-center space-x-2 mt-3">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm flex items-center justify-center text-white text-xs">📍</div>
              <span className="text-gray-700">Your Location</span>
            </div>
          </div>
        </div> */}

      </Map>
      </APIProvider>
      
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
