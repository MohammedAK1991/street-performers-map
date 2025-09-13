import { useState, useEffect } from 'react';

/// <reference lib="dom" />

interface UserLocation {
  coordinates: [number, number];
  address: string;
  name?: string;
}

interface UseUserLocationReturn {
  userLocation: UserLocation | null;
  isLoading: boolean;
  error: string | null;
}

export function useUserLocation(): UseUserLocationReturn {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentLocation = async () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser');
        setIsLoading(false);
        return;
      }

      try {
        // eslint-disable-next-line no-undef
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          });
        });

        const { latitude, longitude } = position.coords;

        // Reverse geocoding to get address
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();

          const address =
            data.localityInfo?.administrative?.[0]?.name ||
            data.localityInfo?.administrative?.[1]?.name ||
            data.city ||
            `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

          setUserLocation({
            coordinates: [longitude, latitude],
            address: address,
            name: data.principalSubdivision?.name || data.countryName,
          });
        } catch (geocodeError) {
          // If reverse geocoding fails, use coordinates
          setUserLocation({
            coordinates: [longitude, latitude],
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            name: 'Current Location',
          });
        }
      } catch (locationError: any) {
        console.warn('Failed to get user location:', locationError);
        setError(locationError.message);
      } finally {
        setIsLoading(false);
      }
    };

    getCurrentLocation();
  }, []);

  return { userLocation, isLoading, error };
}
