import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (place: {
    name: string;
    address: string;
    coordinates: [number, number];
  }) => void;
  placeholder?: string;
  className?: string;
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Search for a location...",
  className = ""
}: GooglePlacesAutocompleteProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const autocompleteService = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize Google Maps API
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
        setError('Google Maps API key is required. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
        return;
      }

      try {
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places']
        });
        
        await loader.load();
        
        // Initialize services with old API (it still works)
        autocompleteService.current = new google.maps.places.AutocompleteService();
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
        setError('Failed to load Google Maps API. Please check your API key.');
      }
    };

    initializeGoogleMaps();
  }, []);

  // Sync external value with internal input value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setInputValue(inputValue);
    setError(null);

    if (!isLoaded || !autocompleteService.current) return;

    if (inputValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setShowSuggestions(true);

    // Use the old API but without country restriction
    autocompleteService.current.getPlacePredictions(
      {
        input: inputValue,
        types: ['establishment', 'geocode']
        // Removed componentRestrictions to allow global results
      },
      (predictions: any, status: any) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      }
    );
  };

  const handleSelect = (prediction: any) => {
    const description = prediction.description || prediction.text?.text || prediction.displayName?.text;
    setInputValue(description);
    setShowSuggestions(false);
    setError(null);

    // For new API, we can get coordinates directly from the suggestion
    if (prediction.placePrediction?.place) {
      const place = prediction.placePrediction.place;
      const location = place.location;
      if (location) {
        onChange({
          name: place.displayName?.text || description,
          address: place.formattedAddress || description,
          coordinates: [location.longitude, location.latitude]
        });
        return;
      }
    }

    // Fallback: try to get coordinates from the suggestion itself
    if (prediction.placePrediction?.place?.location) {
      const location = prediction.placePrediction.place.location;
      onChange({
        name: prediction.placePrediction.place.displayName?.text || description,
        address: prediction.placePrediction.place.formattedAddress || description,
        coordinates: [location.longitude, location.latitude]
      });
      return;
    }

    // If no coordinates available, use default
    onChange({
      name: description,
      address: description,
      coordinates: [0, 0]
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      handleSelect(suggestions[0]);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Show fallback UI when API key is missing
  if (error && error.includes('API key is required')) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onChange({
            name: e.target.value,
            address: e.target.value,
            coordinates: [0, 0] // Default coordinates
          })}
          placeholder="Enter location manually (Google Places API key required)"
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 ${className}`}
        />
        <div className="mt-1 text-xs text-gray-500">
          Google Places API key required for autocomplete. Enter location manually.
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => setShowSuggestions(inputValue.length >= 2)}
          placeholder={isLoaded ? placeholder : "Loading Google Places..."}
          disabled={!isLoaded}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 ${className} ${
            !isLoaded ? 'bg-gray-100' : ''
          } ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((prediction, index) => {
            const description = prediction.description || 
                              prediction.text?.text || 
                              prediction.displayName?.text ||
                              prediction.placePrediction?.place?.displayName?.text ||
                              prediction.placePrediction?.place?.formattedAddress;
            const key = prediction.place_id || prediction.placePrediction?.place?.id || index;
            
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(prediction)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              >
                <div className="text-sm text-gray-900">{description}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-1 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}