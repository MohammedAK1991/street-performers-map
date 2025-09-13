import { useState } from "react";
import { GooglePlacesAutocomplete } from "../../GooglePlacesAutocomplete";
import type { OnboardingData } from "../OnboardingWizard";

interface LocationStepProps {
	data: OnboardingData;
	updateData: (data: Partial<OnboardingData>) => void;
	nextStep: () => void;
	prevStep: () => void;
}

const popularCities = [
	{
		name: "Madrid",
		country: "Spain",
		coords: [40.4168, -3.7038] as [number, number],
	},
	{
		name: "Barcelona",
		country: "Spain",
		coords: [41.3851, 2.1734] as [number, number],
	},
	{
		name: "Paris",
		country: "France",
		coords: [48.8566, 2.3522] as [number, number],
	},
	{
		name: "London",
		country: "UK",
		coords: [51.5074, -0.1278] as [number, number],
	},
	{
		name: "Berlin",
		country: "Germany",
		coords: [52.52, 13.405] as [number, number],
	},
	{
		name: "Amsterdam",
		country: "Netherlands",
		coords: [52.3676, 4.9041] as [number, number],
	},
	{
		name: "Rome",
		country: "Italy",
		coords: [41.9028, 12.4964] as [number, number],
	},
	{
		name: "Vienna",
		country: "Austria",
		coords: [48.2082, 16.3738] as [number, number],
	},
];

const performanceAreas = [
	{
		id: "city-center",
		name: "City Center",
		icon: "🏛️",
		description: "Main squares, pedestrian areas",
	},
	{
		id: "tourist-areas",
		name: "Tourist Areas",
		icon: "📸",
		description: "Near attractions, landmarks",
	},
	{
		id: "transport-hubs",
		name: "Transport Hubs",
		icon: "🚇",
		description: "Metro, train stations, airports",
	},
	{
		id: "parks",
		name: "Parks & Gardens",
		icon: "🌳",
		description: "Public parks, green spaces",
	},
	{
		id: "beaches",
		name: "Beaches & Waterfront",
		icon: "🏖️",
		description: "Seaside, lakefront, rivers",
	},
	{
		id: "shopping",
		name: "Shopping Areas",
		icon: "🛍️",
		description: "Malls, shopping streets",
	},
	{
		id: "nightlife",
		name: "Nightlife Districts",
		icon: "🌃",
		description: "Bars, clubs, entertainment",
	},
	{
		id: "markets",
		name: "Markets & Festivals",
		icon: "🎪",
		description: "Food markets, street fairs",
	},
];

export function LocationStep({
	data,
	updateData,
	nextStep,
	prevStep,
}: LocationStepProps) {
	const [selectedCity, setSelectedCity] = useState<string>(data.city || "");
	const [selectedCountry, setSelectedCountry] = useState<string>(
		data.country || "",
	);
	const [coordinates, setCoordinates] = useState<[number, number]>(
		data.coordinates || [0, 0],
	);
	const [selectedAreas, setSelectedAreas] = useState<string[]>(
		data.performanceAreas || [],
	);

	const handleCitySelect = (city: (typeof popularCities)[0]) => {
		setSelectedCity(city.name);
		setSelectedCountry(city.country);
		setCoordinates(city.coords);
	};

	const handlePlaceSelect = (place: any) => {
		if (place.formatted_address && place.geometry?.location) {
			// Extract city and country from Google Places
			const addressComponents = place.address_components || [];
			let city = "";
			let country = "";

			for (const component of addressComponents) {
				if (component.types.includes("locality")) {
					city = component.long_name;
				}
				if (component.types.includes("country")) {
					country = component.long_name;
				}
			}

			setSelectedCity(city || place.name || "");
			setSelectedCountry(country || "");
			setCoordinates([
				place.geometry.location.lat(),
				place.geometry.location.lng(),
			]);
		}
	};

	const handleAreaToggle = (areaId: string) => {
		const newAreas = selectedAreas.includes(areaId)
			? selectedAreas.filter((a) => a !== areaId)
			: [...selectedAreas, areaId];
		setSelectedAreas(newAreas);
	};

	const canContinue =
		selectedCity && selectedCountry && selectedAreas.length > 0;

	const handleNext = () => {
		updateData({
			city: selectedCity,
			country: selectedCountry,
			coordinates: coordinates,
			performanceAreas: selectedAreas,
		});
		nextStep();
	};

	return (
		<div className="space-y-8">
			{/* Instructions */}
			<div className="text-center">
				<p className="text-muted-foreground mb-2">
					Your city is where you'll appear on our global map.
				</p>
				<p className="text-sm text-muted-foreground/80">
					Audiences can find and hire performers in their area.
				</p>
			</div>

			{/* City Selection */}
			<div>
				<h3 className="font-semibold text-foreground mb-4">
					🗺️ What city do you primarily perform in?
				</h3>

				{/* Google Places Autocomplete */}
				<div className="mb-4">
					<GooglePlacesAutocomplete
						onPlaceSelect={handlePlaceSelect}
						placeholder="Search for your city..."
						className="w-full p-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
					/>
				</div>

				{/* Popular Cities Quick Select */}
				<div>
					<p className="text-sm text-muted-foreground mb-3">
						Or select from popular cities:
					</p>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
						{popularCities.map((city) => (
							<button
								type="button"
								key={`${city.name}-${city.country}`}
								onClick={() => handleCitySelect(city)}
								className={`p-3 text-sm rounded-lg border transition-all ${
									selectedCity === city.name && selectedCountry === city.country
										? "border-primary bg-primary/10 text-primary"
										: "border-border hover:border-primary/50 bg-card text-foreground hover:bg-card/80"
								}`}
							>
								<div className="font-medium">{city.name}</div>
								<div className="text-xs text-muted-foreground">{city.country}</div>
							</button>
						))}
					</div>
				</div>

				{/* Selected City Display */}
				{selectedCity && selectedCountry && (
					<div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
						<div className="flex items-center space-x-2">
							<span className="text-green-500">📍</span>
							<div>
								<div className="font-medium text-green-600 dark:text-green-400">
									{selectedCity}, {selectedCountry}
								</div>
								<div className="text-sm text-green-500/80 dark:text-green-400/80">
									Your performances will appear here on our map
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Performance Areas */}
			{selectedCity && (
				<div>
					<h3 className="font-semibold text-foreground mb-4">
						🎯 Where in {selectedCity} do you usually perform?
					</h3>
					<p className="text-sm text-muted-foreground mb-4">
						Select all areas where audiences might find you. This helps with
						discovery.
					</p>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{performanceAreas.map((area) => (
							<button
								key={area.id}
								onClick={() => handleAreaToggle(area.id)}
								className={`p-4 rounded-lg border-2 transition-all text-left ${
									selectedAreas.includes(area.id)
										? "border-primary bg-primary/10 text-primary"
										: "border-border hover:border-primary/50 bg-card text-foreground hover:bg-card/80"
								}`}
							>
								<div className="flex items-start space-x-3">
									<div className="text-xl">{area.icon}</div>
									<div className="flex-1">
										<h4 className="font-medium text-sm">{area.name}</h4>
										<p className="text-xs text-muted-foreground">{area.description}</p>
									</div>
									{selectedAreas.includes(area.id) && (
										<div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
											<span className="text-primary-foreground text-xs">✓</span>
										</div>
									)}
								</div>
							</button>
						))}
					</div>

					{selectedAreas.length > 0 && (
						<div className="mt-4 text-center text-sm text-muted-foreground">
							{selectedAreas.length} area{selectedAreas.length !== 1 ? "s" : ""}{" "}
							selected
						</div>
					)}
				</div>
			)}

			{/* Legal Notice */}
			{selectedCountry && (
				<div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
					<h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
						⚠️ Know Your Local Laws
					</h4>
					<p className="text-sm text-yellow-600/80 dark:text-yellow-400/80">
						Street performing laws vary by city. Make sure you understand local
						regulations about permits, amplification, and approved locations in{" "}
						{selectedCity}.
						<br />
						<a
							href={`https://google.com/search?q=${selectedCity}+street+performing+busking+permits`}
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:no-underline text-yellow-600 dark:text-yellow-400"
						>
							Search for {selectedCity} busking regulations →
						</a>
					</p>
				</div>
			)}

			{/* Navigation */}
			<div className="flex space-x-4 pt-4">
				<button
					onClick={prevStep}
					className="flex-1 bg-secondary text-secondary-foreground py-3 px-6 rounded-lg font-medium hover:bg-secondary/80 transition-colors"
				>
					← Back
				</button>

				<button
					onClick={handleNext}
					disabled={!canContinue}
					className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
				>
					{canContinue ? "Continue →" : "Select City & Areas"}
				</button>
			</div>
		</div>
	);
}
