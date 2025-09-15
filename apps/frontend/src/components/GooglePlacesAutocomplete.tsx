import { Loader } from "@googlemaps/js-api-loader";
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
		let retryCount = 0;
		const maxRetries = 3;

		const initializeGoogleMaps = async () => {
			const apiKey =
				import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
				"AIzaSyCkm_qSNWEQ0o95mRsqjM8ClF288s6s6qY";

			if (!apiKey || apiKey === "your_google_maps_api_key_here") {
				setError(
					"Google Maps API key is required. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.",
				);
				return;
			}

			// Check if Google Maps is already loaded
			if (window.google?.maps?.places?.AutocompleteService) {
				try {
					autocompleteService.current = new google.maps.places.AutocompleteService();
					getCurrentLocation();
					setIsLoaded(true);
					setError(null);
					return;
				} catch (error) {
					console.error("Error initializing existing Google Maps API:", error);
				}
			}

			try {
				const loader = new Loader({
					apiKey: apiKey,
					version: "weekly",
					libraries: ["places"],
					retries: 3,
				});

				// Add timeout to the loading
				const loadPromise = loader.load();
				const timeoutPromise = new Promise((_, reject) =>
					setTimeout(() => reject(new Error("Google Maps API loading timeout")), 10000)
				);

				await Promise.race([loadPromise, timeoutPromise]);

				// Wait a bit for the API to be fully initialized
				await new Promise(resolve => setTimeout(resolve, 500));

				// Double-check that the API is actually loaded
				if (!window.google?.maps?.places?.AutocompleteService) {
					throw new Error("Google Maps Places API not available after loading");
				}

				// Initialize services
				autocompleteService.current = new google.maps.places.AutocompleteService();
				getCurrentLocation();
				setIsLoaded(true);
				setError(null);
			} catch (error) {
				console.error("Error loading Google Maps API:", error);
				retryCount++;

				if (retryCount <= maxRetries) {
					const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff
					setError(`Loading Google Maps API... (attempt ${retryCount}/${maxRetries})`);
					setTimeout(() => {
						if (!isLoaded) {
							initializeGoogleMaps();
						}
					}, delay);
				} else {
					setError("Failed to load Google Maps API. Please refresh the page and try again.");
				}
			}
		};

		initializeGoogleMaps();
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
				types: ["establishment", "geocode"],
				// Removed componentRestrictions to allow global results
			},
			(predictions: any, status: any) => {
				setIsLoading(false);
				if (
					status === google.maps.places.PlacesServiceStatus.OK &&
					predictions
				) {
					setSuggestions(predictions);
				} else {
					setSuggestions([]);
				}
			},
		);
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
