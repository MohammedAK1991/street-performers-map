import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { GooglePlacesAutocomplete } from "@/components/GooglePlacesAutocomplete";
import type { User } from "@spm/shared-types";

interface ArtistsResponse {
	users: User[];
	total: number;
}

export function ArtistsList() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [location, setLocation] = useState({
		lat: Number(searchParams.get('lat')) || 40.4168, // Madrid default
		lng: Number(searchParams.get('lng')) || -3.7038,
		address: searchParams.get('location') || 'Madrid, Spain'
	});
	const [radius] = useState(25); // km
	const [selectedGenre, setSelectedGenre] = useState<string>(searchParams.get('genre') || '');

	const genres = [
		'all',
		'rock',
		'jazz', 
		'folk',
		'pop',
		'classical',
		'blues',
		'country',
		'electronic',
		'hip-hop',
		'reggae',
		'other'
	];

	// Fetch nearby artists
	const { data: artistsData, isLoading } = useQuery<ArtistsResponse>({
		queryKey: ['artists', location.lat, location.lng, radius, selectedGenre],
		queryFn: async () => {
			const params = new URLSearchParams({
				lat: location.lat.toString(),
				lng: location.lng.toString(),
				radius: radius.toString(),
				role: 'performer'
			});
			
			if (selectedGenre && selectedGenre !== 'all') {
				params.append('genre', selectedGenre);
			}

			const response = await api.get(`/users/nearby?${params}`);
			return response.data.data;
		},
		refetchInterval: 30000 // Refresh every 30 seconds
	});

	const handleLocationChange = (place: any) => {
		const newLocation = {
			lat: place.geometry.location.lat(),
			lng: place.geometry.location.lng(),
			address: place.formatted_address || place.name
		};
		setLocation(newLocation);
		
		// Update URL params
		const newParams = new URLSearchParams(searchParams);
		newParams.set('lat', newLocation.lat.toString());
		newParams.set('lng', newLocation.lng.toString());
		newParams.set('location', newLocation.address);
		setSearchParams(newParams);
	};

	const handleGenreFilter = (genre: string) => {
		setSelectedGenre(genre);
		const newParams = new URLSearchParams(searchParams);
		if (genre && genre !== 'all') {
			newParams.set('genre', genre);
		} else {
			newParams.delete('genre');
		}
		setSearchParams(newParams);
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="bg-card border-b border-border">
				<div className="max-w-6xl mx-auto px-4 py-6">
					<div className="flex items-center gap-4 mb-4">
						<Link 
							to="/" 
							className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
							Back to Map
						</Link>
					</div>
					<h1 className="text-3xl font-bold text-foreground mb-2">
						🎭 Discover Local Artists
					</h1>
					<p className="text-muted-foreground">
						Find talented street performers near you and support local music
					</p>
				</div>
			</div>

			{/* Filters */}
			<div className="bg-card border-b border-border">
				<div className="max-w-6xl mx-auto px-4 py-4">
					<div className="flex flex-col md:flex-row gap-4">
						{/* Location Search */}
						<div className="flex-1">
							<label className="block text-sm font-medium text-foreground mb-2">
								📍 Location
							</label>
							<GooglePlacesAutocomplete
								onPlaceSelect={handleLocationChange}
								value={location.address}
								placeholder="Search for a city or area..."
								className="w-full"
							/>
						</div>

						{/* Genre Filter */}
						<div className="md:w-64">
							<label className="block text-sm font-medium text-foreground mb-2">
								🎵 Genre
							</label>
							<select
								value={selectedGenre}
								onChange={(e) => handleGenreFilter(e.target.value)}
								className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:ring-primary focus:border-primary"
							>
								{genres.map((genre) => (
									<option key={genre} value={genre}>
										{genre === 'all' ? 'All Genres' : genre.charAt(0).toUpperCase() + genre.slice(1)}
									</option>
								))}
							</select>
						</div>

						{/* Results Count */}
						<div className="flex items-end">
							<div className="text-sm text-muted-foreground">
								{artistsData?.total || 0} artists found
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Results */}
			<div className="max-w-6xl mx-auto px-4 py-8">
				{isLoading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{[...Array(6)].map((_, i) => (
							<div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse">
								<div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4"></div>
								<div className="h-4 bg-muted rounded mb-2"></div>
								<div className="h-3 bg-muted rounded mb-4"></div>
								<div className="flex justify-center space-x-2">
									<div className="h-8 w-16 bg-muted rounded"></div>
									<div className="h-8 w-16 bg-muted rounded"></div>
								</div>
							</div>
						))}
					</div>
				) : artistsData?.users?.length === 0 ? (
					<div className="text-center py-12">
						<div className="text-6xl mb-4">🎭</div>
						<h3 className="text-xl font-semibold text-foreground mb-2">No artists found</h3>
						<p className="text-muted-foreground mb-6">
							Try expanding your search area or changing the genre filter
						</p>
						<Link 
							to="/map"
							className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
						>
							View Map Instead
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{artistsData?.users.map((artist) => (
							<Link
								key={artist._id}
								to={`/artist/${artist._id}`}
								className="bg-card hover:bg-card/80 rounded-lg border border-border p-6 transition-colors group"
							>
								{/* Profile Picture */}
								<div className="text-center mb-4">
									<div className="w-20 h-20 mx-auto mb-3 relative">
										{artist.profile?.avatar ? (
											<img
												src={artist.profile.avatar}
												alt={artist.profile.displayName}
												className="w-full h-full rounded-full object-cover border-2 border-primary/20 group-hover:border-primary/40 transition-colors"
											/>
										) : (
											<div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
												<span className="text-2xl font-bold text-primary">
													{artist.profile.displayName.charAt(0).toUpperCase()}
												</span>
											</div>
										)}
										{/* Online Status */}
										<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-card"></div>
									</div>
									<h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
										{artist.profile.displayName}
									</h3>
									<p className="text-sm text-muted-foreground capitalize">
										{artist.profile.genres?.slice(0, 2).join(', ') || 'Multi-genre'}
									</p>
								</div>

								{/* Stats */}
								<div className="flex justify-around text-sm text-muted-foreground border-t border-border pt-4">
									<div className="text-center">
										<div className="font-semibold text-foreground">{artist.statistics.performanceCount}</div>
										<div className="text-xs">Shows</div>
									</div>
									<div className="text-center">
										<div className="font-semibold text-foreground">{artist.statistics.totalLikes}</div>
										<div className="text-xs">Likes</div>
									</div>
									<div className="text-center">
										<div className="font-semibold text-foreground">€{artist.statistics.totalTips}</div>
										<div className="text-xs">Tips</div>
									</div>
								</div>

								{/* Location */}
								<div className="mt-4 text-xs text-muted-foreground text-center">
									📍 {artist.location.city}, {artist.location.country}
								</div>

								{/* Action Buttons */}
								<div className="mt-4 flex space-x-2">
									<div className="flex-1 bg-primary/10 text-primary text-xs py-2 px-3 rounded text-center font-medium group-hover:bg-primary/20 transition-colors">
										View Profile
									</div>
									<div className="flex-1 bg-green-500/10 text-green-600 text-xs py-2 px-3 rounded text-center font-medium group-hover:bg-green-500/20 transition-colors">
										💰 Tip
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}