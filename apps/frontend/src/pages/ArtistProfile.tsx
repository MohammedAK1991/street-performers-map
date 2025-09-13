import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/utils/api";
import { TipModal } from "@/components/TipModal";
import type { User, Performance } from "@spm/shared-types";

export function ArtistProfile() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [showTipModal, setShowTipModal] = useState(false);

	// Fetch artist profile
	const { data: artist, isLoading: artistLoading } = useQuery<User>({
		queryKey: ['artist', id],
		queryFn: async () => {
			const response = await api.get(`/users/${id}`);
			return response.data.data;
		},
		enabled: !!id
	});

	// Fetch artist's recent performances  
	const { data: performances } = useQuery<Performance[]>({
		queryKey: ['artist-performances', id],
		queryFn: async () => {
			const response = await api.get(`/performances/by-performer/${id}`);
			return response.data.data;
		},
		enabled: !!id
	});

	if (artistLoading || !artist) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-orange-600">Loading profile...</p>
				</div>
			</div>
		);
	}


	return (
		<>
			<div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
				{/* Header */}
				<div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
					<div className="max-w-6xl mx-auto px-4 py-4">
						<button
							onClick={() => navigate(-1)}
							className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
							<span>Back</span>
						</button>
					</div>
				</div>

				{/* Hero Section */}
				<div className="relative">
					{/* Cover Photo */}
					<div 
						className="h-96 bg-cover bg-center bg-gray-400 relative"
						style={{
							backgroundImage: artist.profile?.avatar 
								? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${artist.profile.avatar})`
								: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
						}}
					>
						{/* Overlay Content */}
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="text-center text-white">
								{/* Profile Frame */}
								<div className="relative inline-block">
									<div className="w-48 h-48 border-4 border-white rounded-full overflow-hidden shadow-2xl mx-auto mb-6">
										{artist.profile?.avatar ? (
											<img
												src={artist.profile.avatar}
												alt={artist.profile.displayName}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
												<span className="text-6xl font-bold text-white">
													{artist.profile.displayName.charAt(0).toUpperCase()}
												</span>
											</div>
										)}
									</div>
								</div>

								{/* Artist Info */}
								<div className="bg-black/20 backdrop-blur-sm border-2 border-white/30 rounded-lg px-8 py-6 inline-block">
									<h1 className="text-4xl font-bold mb-2 tracking-wide">
										{artist.profile.displayName.toUpperCase()}
									</h1>
									<div className="border-t border-white/50 my-4"></div>
									<div className="flex items-center justify-center space-x-4 text-lg">
										<span className="bg-orange-500 px-3 py-1 rounded-full text-sm font-medium">
											{artist.profile.genres?.slice(0, 1)[0]?.toUpperCase() || 'ARTIST'}
										</span>
										<span>|</span>
										<span>{artist.location.city}, {artist.location.country}</span>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="mt-8 flex justify-center space-x-4">
									<button
										onClick={() => setShowTipModal(true)}
										className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors shadow-lg flex items-center space-x-2"
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
										</svg>
										<span>TIP ME</span>
									</button>
									<button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors shadow-lg border border-white/30 flex items-center space-x-2">
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
										</svg>
										<span>HIRE ME</span>
									</button>
								</div>

								{/* Share Button */}
								<button className="mt-4 text-white/80 hover:text-white transition-colors flex items-center justify-center mx-auto space-x-2">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
									</svg>
									<span className="text-sm">SHARE</span>
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="max-w-4xl mx-auto px-4 py-12">
					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
						<div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-orange-500">
							<div className="text-3xl font-bold text-gray-800 mb-2">
								{artist.statistics.performanceCount}
							</div>
							<div className="text-sm text-gray-600 uppercase tracking-wide">
								Performances
							</div>
						</div>
						<div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-green-500">
							<div className="text-3xl font-bold text-gray-800 mb-2">
								€{artist.statistics.totalTips}
							</div>
							<div className="text-sm text-gray-600 uppercase tracking-wide">
								Tips Earned
							</div>
						</div>
						<div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-blue-500">
							<div className="text-3xl font-bold text-gray-800 mb-2">
								{artist.statistics.totalLikes}
							</div>
							<div className="text-sm text-gray-600 uppercase tracking-wide">
								Likes
							</div>
						</div>
					</div>

					{/* About Section */}
					<div className="bg-white rounded-lg shadow-md p-8 mb-8">
						<h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
							<svg className="w-6 h-6 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
							About {artist.profile.displayName}
						</h2>
						{artist.profile.bio ? (
							<p className="text-gray-600 leading-relaxed">
								{artist.profile.bio}
							</p>
						) : (
							<p className="text-gray-400 italic">
								This artist hasn't added a bio yet.
							</p>
						)}

						{/* Genres */}
						{artist.profile.genres && artist.profile.genres.length > 0 && (
							<div className="mt-6">
								<h3 className="font-semibold text-gray-800 mb-2">Genres:</h3>
								<div className="flex flex-wrap gap-2">
									{artist.profile.genres.map((genre) => (
										<span key={genre} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium capitalize">
											{genre}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Social Links */}
						{artist.profile.socialLinks && Object.values(artist.profile.socialLinks).some(link => link) && (
							<div className="mt-6">
								<h3 className="font-semibold text-gray-800 mb-3">Connect:</h3>
								<div className="flex space-x-4">
									{artist.profile.socialLinks.instagram && (
										<a 
											href={artist.profile.socialLinks.instagram} 
											target="_blank" 
											rel="noopener noreferrer"
											className="text-pink-600 hover:text-pink-700 transition-colors"
										>
											<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
												<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
											</svg>
										</a>
									)}
									{artist.profile.socialLinks.youtube && (
										<a 
											href={artist.profile.socialLinks.youtube} 
											target="_blank" 
											rel="noopener noreferrer"
											className="text-red-600 hover:text-red-700 transition-colors"
										>
											<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
												<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
											</svg>
										</a>
									)}
									{artist.profile.socialLinks.spotify && (
										<a 
											href={artist.profile.socialLinks.spotify} 
											target="_blank" 
											rel="noopener noreferrer"
											className="text-green-600 hover:text-green-700 transition-colors"
										>
											<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
												<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
											</svg>
										</a>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Recent Performances */}
					<div className="bg-white rounded-lg shadow-md p-8">
						<h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
							<svg className="w-6 h-6 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
							</svg>
							Recent Performances
						</h2>

						{performances && performances.length > 0 ? (
							<div className="space-y-4">
								{performances.slice(0, 5).map((performance) => (
									<div key={performance._id} className="border-l-4 border-orange-200 bg-orange-50 p-4 rounded">
										<h3 className="font-semibold text-gray-800">{performance.title}</h3>
										<p className="text-sm text-gray-600 mt-1">{performance.description}</p>
										<div className="flex items-center justify-between mt-2 text-xs text-gray-500">
											<span>📍 {performance.route?.stops?.[0]?.location.name}</span>
											<span>{new Date(performance.createdAt).toLocaleDateString()}</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-gray-400">
								<svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
								</svg>
								<p>No performances yet</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Tip Modal */}
			<TipModal
				isOpen={showTipModal}
				performerId={artist._id}
				performerName={artist.profile.displayName}
				performanceId={performances?.[0]?._id || ''} // Use latest performance or empty string
				onClose={() => setShowTipModal(false)}
			/>
		</>
	);
}