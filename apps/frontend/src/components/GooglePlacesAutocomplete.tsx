import { useEffect, useRef, useState } from "react";

interface GooglePlacesAutocompleteProps {
	value?: string;
	onChange?: (place: {
		name: string;
		address: string;
		coordinates: [number, number];
	}) => void;
	onPlaceSelect?: (place: any) => void;
	placeholder?: string;
	className?: string;
}

export function GooglePlacesAutocomplete({
	value,
	onChange,
	onPlaceSelect,
	placeholder = "Search for a location...",
	className = "",
}: GooglePlacesAutocompleteProps) {
	const [error, setError] = useState<string | null>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const [suggestions, setSuggestions] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [inputValue, setInputValue] = useState(value);
	const [currentLocation, setCurrentLocation] = useState<any>(null);
	const autocompleteService = useRef<any>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Initialize Google Maps API
	useEffect(() => {
		let isMounted = true;
		let retryCount = 0;
		const maxRetries = 2;
		let timeoutId: NodeJS.Timeout;

		const initializeGoogleMaps = async () => {
			if (!isMounted) return;

			const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

			if (!apiKey) {
				if (isMounted) {
					setError("Google Maps API key is required.");
				}
				return;
			}

			// Check if Google Maps is already loaded
			if (window.google?.maps?.places) {
				if (isMounted) {
					getCurrentLocation();
					setIsLoaded(true);
					setError(null);
				}
				return;
			}

			try {
				if (isMounted) {
					setError(`Loading Google Maps API... (attempt ${retryCount + 1}/${maxRetries + 1})`);
				}

				// Use direct script injection to avoid loader conflicts
				await new Promise<void>((resolve, reject) => {
					// Check if script is already being loaded
					const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
					if (existingScript) {
						// Wait for existing script to load
						if (window.google?.maps?.places) {
							resolve();
							return;
						}
						// Set up listener for when it loads
						const checkLoaded = setInterval(() => {
							if (window.google?.maps?.places) {
								clearInterval(checkLoaded);
								resolve();
							}
						}, 100);
						setTimeout(() => {
							clearInterval(checkLoaded);
							if (!window.google?.maps?.places) {
								reject(new Error("Existing script failed to load"));
							}
						}, 10000);
						return;
					}

					const script = document.createElement('script');
					const callbackName = `initGoogleMaps_${Date.now()}_${retryCount}`;
					script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&callback=${callbackName}`;
					script.async = true;
					script.defer = true;

					// Set up global callback
					(window as any)[callbackName] = () => {
						try {
							if (window.google?.maps?.places) {
								resolve();
							} else {
								throw new Error("Google Maps Places API not available");
							}
						} catch (error) {
							reject(error);
						} finally {
							// Clean up
							delete (window as any)[callbackName];
						}
					};

					script.onerror = () => {
						reject(new Error("Failed to load Google Maps script"));
						delete (window as any)[callbackName];
					};

					document.head.appendChild(script);

					// Timeout fallback
					setTimeout(() => {
						if (!window.google?.maps?.places) {
							reject(new Error("Google Maps API loading timeout"));
							delete (window as any)[callbackName];
						}
					}, 15000);
				});

				// Initialize services only if component is still mounted
				if (isMounted) {
					getCurrentLocation();
					setIsLoaded(true);
					setError(null);
				}
			} catch (error) {
				console.error("Google Maps API loading failed:", error);
				retryCount++;

				if (retryCount <= maxRetries && isMounted) {
					const delay = Math.min(2000 * retryCount, 5000);
					setError(`Loading Google Maps API... (attempt ${retryCount + 1}/${maxRetries + 1})`);
					timeoutId = setTimeout(() => {
						if (isMounted && !isLoaded) {
							initializeGoogleMaps();
						}
					}, delay);
				} else if (isMounted) {
					setError("Google Maps API failed to load. Please refresh the page.");
				}
			}
		};

		initializeGoogleMaps();

		// Cleanup function
		return () => {
			isMounted = false;
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, []);

	// Get user's current location
	const getCurrentLocation = () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const lat = position.coords.latitude;
					const lng = position.coords.longitude;

					// Use reverse geocoding to get address
					const geocoder = new google.maps.Geocoder();
					geocoder.geocode({ location: { lat, lng } }, (results, status) => {
						if (status === "OK" && results && results[0]) {
							setCurrentLocation({
								description: results[0].formatted_address,
								place_id: "current_location",
								geometry: {
									location: { lat: () => lat, lng: () => lng },
								},
							});
						}
					});
				},
				() => {},
			);
		}
	};

	// Sync external value with internal input value
	useEffect(() => {
		setInputValue(value);
	}, [value]);

	const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value;
		setInputValue(inputValue);
		setError(null);

		if (!isLoaded || !window.google?.maps?.places) return;

		if (inputValue.length < 2) {
			setSuggestions([]);
			setShowSuggestions(false);
			return;
		}

		setIsLoading(true);
		setShowSuggestions(true);

		// Use the reliable legacy AutocompleteService API
		if (!autocompleteService.current && window.google?.maps?.places?.AutocompleteService) {
			autocompleteService.current = new google.maps.places.AutocompleteService();
		}

		if (autocompleteService.current) {
			autocompleteService.current.getPlacePredictions(
				{
					input: inputValue,
					types: ["establishment", "geocode"],
					// Removed componentRestrictions to allow global results
				},
				(predictions: any, status: any) => {
					setIsLoading(false);
					if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
						console.log("Places predictions:", predictions);
						setSuggestions(predictions);
					} else {
						console.log("Places API status:", status);
						setSuggestions([]);
					}
				},
			);
		} else {
			setIsLoading(false);
			setSuggestions([]);
		}
	};

	const handleSelect = (prediction: any) => {
		const description =
			prediction.description ||
			prediction.text?.text ||
			prediction.displayName?.text;
		setInputValue(description);
		setShowSuggestions(false);
		setError(null);

		// Debug: Log the prediction to see its structure

		// Handle current location
		if (
			prediction.isCurrentLocation ||
			prediction.place_id === "current_location"
		) {
			const lat =
				prediction.lat ||
				(prediction.geometry?.location?.lat
					? prediction.geometry.location.lat()
					: 0);
			const lng =
				prediction.lng ||
				(prediction.geometry?.location?.lng
					? prediction.geometry.location.lng()
					: 0);
			onChange?.({
				name: prediction.name || description,
				address: prediction.address || description,
				coordinates: [lng, lat],
			});
			onPlaceSelect?.(prediction);
			return;
		}

		// For new API, we can get coordinates directly from the suggestion
		if (prediction.placePrediction?.place) {
			const place = prediction.placePrediction.place;
			const location = place.location;
			if (location) {
				const coords: [number, number] = [
					location.longitude,
					location.latitude,
				];
				onChange?.({
					name: place.displayName?.text || description,
					address: place.formattedAddress || description,
					coordinates: coords,
				});
				return;
			}
		}

		// Fallback: try to get coordinates from the suggestion itself
		if (prediction.placePrediction?.place?.location) {
			const location = prediction.placePrediction.place.location;
			onChange?.({
				name: prediction.placePrediction.place.displayName?.text || description,
				address:
					prediction.placePrediction.place.formattedAddress || description,
				coordinates: [location.longitude, location.latitude],
			});
			return;
		}

		// For old API, try to get coordinates from geometry
		if (prediction.geometry?.location) {
			const lat = prediction.geometry.location.lat();
			const lng = prediction.geometry.location.lng();
			onChange?.({
				name: description,
				address: description,
				coordinates: [lng, lat],
			});
			return;
		}

		// If no coordinates available, try geocoding
		if (window.google?.maps?.Geocoder) {
			const geocoder = new window.google.maps.Geocoder();
			geocoder.geocode({ address: description }, (results, status) => {
				if (status === "OK" && results && results[0]) {
					const location = results[0].geometry.location;
					const lat = location.lat();
					const lng = location.lng();
					onChange?.({
						name: description,
						address: description,
						coordinates: [lng, lat],
					});
				} else {
					console.warn("Geocoding failed:", status);
					// Fallback to default coordinates
					onChange?.({
						name: description,
						address: description,
						coordinates: [0, 0],
					});
				}
			});
		} else {
			// If no coordinates available, use default
			onChange?.({
				name: description,
				address: description,
				coordinates: [0, 0],
			});
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && suggestions.length > 0) {
			e.preventDefault();
			handleSelect(suggestions[0]);
		}
	};

	const handleBlur = () => {
		// Delay hiding suggestions to allow clicking on them
		setTimeout(() => setShowSuggestions(false), 200);
	};

	// Show fallback UI when API fails or is missing
	if (error && (error.includes("API key is required") || error.includes("Failed to load") || error.includes("Please refresh"))) {
		return (
			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={(e) => {
						setInputValue(e.target.value);
						onChange?.({
							name: e.target.value,
							address: e.target.value,
							coordinates: [0, 0], // Default coordinates
						});
					}}
					placeholder="Enter location manually"
					className={`w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary ${className}`}
				/>
				<div className="mt-1 text-xs text-muted-foreground">
					{error.includes("API key")
						? "Google Places API key required for autocomplete. Enter location manually."
						: "Location autocomplete unavailable. Enter location manually."
					}
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
					onFocus={() => setShowSuggestions(true)}
					placeholder={isLoaded ? placeholder : "Loading Google Places..."}
					disabled={!isLoaded}
					className={`w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary ${className} ${
						!isLoaded ? "bg-muted" : ""
					} ${error ? "border-destructive focus:border-destructive focus:ring-destructive" : ""}`}
				/>
				{isLoading && (
					<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
					</div>
				)}
			</div>

			{/* Suggestions dropdown */}
			{showSuggestions && (suggestions.length > 0 || currentLocation) && (
				<div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
					{/* Current location first */}
					{currentLocation && (
						<button
							key="current_location"
							type="button"
							onClick={() => handleSelect(currentLocation)}
							className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border"
						>
							<div className="text-sm text-foreground flex items-center">
								<span className="mr-2">📍</span>
								{currentLocation.description}
							</div>
						</button>
					)}

					{/* Other suggestions */}
					{suggestions.map((prediction, index) => {
						const description =
							prediction.description ||
							prediction.text?.text ||
							prediction.displayName?.text ||
							prediction.placePrediction?.place?.displayName?.text ||
							prediction.placePrediction?.place?.formattedAddress;
						const key =
							prediction.place_id ||
							prediction.placePrediction?.place?.id ||
							index;

						return (
							<button
								key={key}
								type="button"
								onClick={() => handleSelect(prediction)}
								className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0"
							>
								<div className="text-sm text-foreground">{description}</div>
							</button>
						);
					})}
				</div>
			)}

			{/* Error message */}
			{error && <div className="mt-1 text-sm text-destructive">{error}</div>}
		</div>
	);
}
