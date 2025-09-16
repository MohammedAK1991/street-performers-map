import { performanceKeys } from "@/hooks/usePerformances";
import { api } from "@/utils/api";
import {
	SignInButton,
	SignUpButton,
	UserButton,
	useUser,
} from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import {
	DollarSign,
	Filter,
	Heart,
	MapPin,
	Menu,
	Music,
	Play,
	Route,
	Timer,
	TrendingUp,
	Users,
	Video,
	Sparkles,
	Star,
	ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroImage from "../assets/hero-street-performance.jpg";

export function Home() {
	const { user: clerkUser, isSignedIn } = useUser();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const queryClient = useQueryClient();

	// Determine if user is authenticated
	const isAuthenticated = isSignedIn && !!clerkUser;

	// Prefetch performances when user gives location permission
	useEffect(() => {
		const prefetchPerformances = async () => {
			if ("geolocation" in navigator) {
				navigator.geolocation.getCurrentPosition(
					async (position) => {
						const { latitude, longitude } = position.coords;

						// Prefetch nearby performances for the map page
						const queryKey = performanceKeys.nearby(
							{ lat: latitude, lng: longitude },
							25, // Max radius
							{}, // No filters initially
						);

						// Only prefetch if not already in cache
						if (!queryClient.getQueryData(queryKey)) {
							try {
								await queryClient.prefetchQuery({
									queryKey,
									queryFn: async () => {
										const params = new URLSearchParams({
											lat: latitude.toString(),
											lng: longitude.toString(),
											radius: "25",
										});

										const response = await api.get(
											`/performances/nearby?${params}`,
										);
										return response.data.data;
									},
									staleTime: 1000 * 60 * 5, // 5 minutes
								});

								console.log("✅ Prefetched performances for map page");
							} catch (error) {
								console.log("⚠️ Failed to prefetch performances:", error);
							}
						}
					},
					() => {
						console.log("⚠️ Location permission denied, skipping prefetch");
					},
					{
						enableHighAccuracy: true,
						timeout: 10000,
						maximumAge: 300000, // 5 minutes
					},
				);
			}
		};

		// Only prefetch if user is authenticated
		if (isAuthenticated) {
			prefetchPerformances();
		}
	}, [isAuthenticated, queryClient]);

	const musicianFeatures = [
		{
			icon: <Video className="w-8 h-8" />,
			title: "Get Noticed",
			description:
				"Showcase your street performances to people who care. No venue required - just your talent and passion.",
		},
		{
			icon: <Route className="w-8 h-8" />,
			title: "Plan Your Spots",
			description:
				"Map out your performance locations and times. Let people find you wherever you choose to perform on the streets.",
		},
		{
			icon: <TrendingUp className="w-8 h-8" />,
			title: "Gain Recognition",
			description:
				"Build a following of people who appreciate street art. Get the exposure and recognition you deserve.",
		},
		{
			icon: <DollarSign className="w-8 h-8" />,
			title: "Receive Support",
			description:
				"Get direct financial support from people who value your art. Every tip helps you continue doing what you love.",
		},
	];

	const fanFeatures = [
		{
			icon: <MapPin className="w-8 h-8" />,
			title: "Find Street Artists",
			description:
				"Discover talented performers in your area who are creating art on the streets and need your support.",
		},
		{
			icon: <Filter className="w-8 h-8" />,
			title: "Explore Different Talents",
			description:
				"Find musicians, dancers, poets, and artists of all kinds performing in public spaces near you.",
		},
		{
			icon: <Heart className="w-8 h-8" />,
			title: "Make a Real Difference",
			description:
				"Your support directly helps struggling artists continue pursuing their passion and sharing their gifts.",
		},
		{
			icon: <Timer className="w-8 h-8" />,
			title: "Connect Directly",
			description:
				"Watch their performances, send tips, and show appreciation for artists who bring life to our streets.",
		},
	];

	const steps = [
		{
			icon: <MapPin className="w-12 h-12" />,
			title: "Set Your Location",
			description:
				"Allow location access to discover street performances happening around you or set your performance route.",
			color: "text-primary",
		},
		{
			icon: <Video className="w-12 h-12" />,
			title: "Create or Discover",
			description:
				"Musicians upload 30-second performance videos and set their schedule. Fans browse and filter by genre, time, and location.",
			color: "text-secondary",
		},
		{
			icon: <Users className="w-12 h-12" />,
			title: "Connect & Support",
			description:
				"Heart performances you love, follow your favorite artists, and support them with digital tips. Build the street music community.",
			color: "text-accent",
		},
	];

	const featuredPerformers = [
		{
			name: "Sofia Martinez",
			genre: "Acoustic Folk",
			location: "Central Park, NYC",
			hearts: 234,
			isLive: true,
			image: "🎸",
			description: "Beautiful acoustic melodies in the heart of the city"
		},
		{
			name: "Jazz Collective",
			genre: "Jazz Fusion",
			location: "Union Square, NYC",
			hearts: 189,
			isLive: false,
			image: "🎷",
			description: "Smooth jazz vibes and improvisational magic"
		},
		{
			name: "Urban Beats",
			genre: "Hip Hop",
			location: "Times Square, NYC",
			hearts: 567,
			isLive: true,
			image: "🥁",
			description: "High-energy beats that make the crowd move"
		},
	];

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
					<div className="flex items-center justify-between">
						{/* Logo */}
						<div className="flex items-center gap-2 flex-shrink-0">
							<span className="text-2xl sm:text-3xl">🎵</span>
							<span className="text-lg sm:text-xl font-bold">
								<span className="hidden sm:inline">Street<span className="text-gradient">PerformersMap</span></span>
								<span className="sm:hidden">SPM</span>
							</span>
						</div>

						{/* Desktop Navigation */}
						<nav className="hidden lg:flex items-center gap-6 xl:gap-8">
							<a
								href="#features"
								className="text-muted-foreground hover:text-foreground transition-colors text-sm"
							>
								Features
							</a>
							<a
								href="#how-it-works"
								className="text-muted-foreground hover:text-foreground transition-colors text-sm"
							>
								How It Works
							</a>
							<a
								href="#community"
								className="text-muted-foreground hover:text-foreground transition-colors text-sm"
							>
								Community
							</a>
						</nav>

						{/* Desktop Actions */}
						<div className="hidden md:flex items-center gap-2 lg:gap-4 flex-shrink-0">
							{isAuthenticated ? (
								<>
									<Link
										to="/map"
										className="text-muted-foreground hover:text-foreground transition-colors text-sm"
									>
										View Map
									</Link>
									<span className="text-muted-foreground text-sm hidden lg:inline">
										Welcome, {clerkUser?.fullName || clerkUser?.username}!
									</span>
									<UserButton afterSignOutUrl="/" />
								</>
							) : (
								<>
									<SignInButton mode="modal">
										<button className="text-muted-foreground hover:text-foreground transition-colors text-sm">
											Sign In
										</button>
									</SignInButton>
									<SignUpButton mode="modal">
										<button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg font-medium transition-colors text-sm">
											Get Started
										</button>
									</SignUpButton>
								</>
							)}
						</div>

						{/* Mobile Menu Button */}
						<button
							className="md:hidden p-2"
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							aria-label="Toggle menu"
						>
							<Menu className="w-6 h-6" />
						</button>
					</div>

					{/* Mobile Menu */}
					{isMenuOpen && (
						<div className="md:hidden mt-4 py-4 border-t border-border/50">
							<nav className="flex flex-col gap-4">
								<a
									href="#features"
									className="text-muted-foreground hover:text-foreground transition-colors py-2"
								>
									Features
								</a>
								<a
									href="#how-it-works"
									className="text-muted-foreground hover:text-foreground transition-colors py-2"
								>
									How It Works
								</a>
								<a
									href="#community"
									className="text-muted-foreground hover:text-foreground transition-colors py-2"
								>
									Community
								</a>
								<div className="flex flex-col gap-2 mt-4">
									{isAuthenticated ? (
										<>
											<Link
												to="/map"
												className="text-muted-foreground hover:text-foreground transition-colors py-2"
											>
												View Map
											</Link>
											<div className="flex items-center justify-between py-2">
												<span className="text-muted-foreground">
													Welcome, {clerkUser?.fullName || clerkUser?.username}!
												</span>
												<UserButton afterSignOutUrl="/" />
											</div>
										</>
									) : (
										<>
											<SignInButton mode="modal">
												<button className="text-muted-foreground hover:text-foreground transition-colors py-2 text-left">
													Sign In
												</button>
											</SignInButton>
											<SignUpButton mode="modal">
												<button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors text-left">
													Get Started
												</button>
											</SignUpButton>
										</>
									)}
								</div>
							</nav>
						</div>
					)}
				</div>
			</header>

			<main>
				{/* Hero Section */}
				<section className="relative min-h-screen flex items-center justify-center overflow-hidden mt-8">
					{/* Background Image with Overlay */}
					<div className="absolute inset-0 z-0">
						<img
							src={heroImage}
							alt="Street performer playing guitar in urban setting"
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
					</div>

					{/* Enhanced Floating Elements */}
					<div className="absolute top-20 left-10 opacity-70 float-animation">
						<div className="bg-accent/20 rounded-full p-4 backdrop-blur-sm border border-accent/30 shadow-lg">
							<Play className="w-6 h-6 text-accent" />
						</div>
					</div>

					<div
						className="absolute top-32 right-16 opacity-70 float-animation"
						style={{ animationDelay: "1s" }}
					>
						<div className="bg-primary/20 rounded-full p-4 backdrop-blur-sm border border-primary/30 shadow-lg">
							<MapPin className="w-6 h-6 text-primary" />
						</div>
					</div>

					<div
						className="absolute bottom-32 left-20 opacity-70 float-animation"
						style={{ animationDelay: "2s" }}
					>
						<div className="bg-secondary/20 rounded-full p-4 backdrop-blur-sm border border-secondary/30 shadow-lg">
							<Heart className="w-6 h-6 text-secondary" />
						</div>
					</div>

					<div
						className="absolute top-1/2 right-8 opacity-60 float-animation"
						style={{ animationDelay: "0.5s" }}
					>
						<div className="bg-accent/15 rounded-lg p-3 backdrop-blur-sm border border-accent/20">
							<Sparkles className="w-5 h-5 text-accent" />
						</div>
					</div>

					<div
						className="absolute bottom-1/4 right-32 opacity-60 float-animation"
						style={{ animationDelay: "1.5s" }}
					>
						<div className="bg-primary/15 rounded-lg p-3 backdrop-blur-sm border border-primary/20">
							<Music className="w-5 h-5 text-primary" />
						</div>
					</div>

					{/* Main Content */}
					<div className="relative z-10 text-center max-w-4xl mx-auto px-6">
						<div className="mb-4">
							<div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
								<Heart className="w-4 h-4 text-primary" />
								<span className="text-primary text-sm font-medium">Supporting Street Artists Worldwide</span>
							</div>
						</div>
						<h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
							<span className="text-gradient hover:scale-105 transition-transform duration-300 inline-block">Street</span>
							<br />
							<span className="text-foreground hover:scale-105 transition-transform duration-300 inline-block">Performers</span>
							<br />
							<span className="text-gradient hover:scale-105 transition-transform duration-300 inline-block">Map</span>
						</h1>

						<p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
							Giving street artists the visibility they deserve. Help struggling performers get noticed,
							gain exposure, and receive the support they need to thrive.
						</p>

						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
							{isAuthenticated ? (
								<Button size="lg" className="min-w-52 text-lg py-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105" asChild>
									<Link to="/map">
										<Play className="w-5 h-5 mr-2" />
										Find Performances
									</Link>
								</Button>
							) : (
								<>
									<SignUpButton mode="modal">
										<Button size="lg" className="min-w-52 text-lg py-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
											<Play className="w-5 h-5 mr-2" />
											Find Performances
										</Button>
									</SignUpButton>

									<Button variant="outline" size="lg" className="min-w-52 text-lg py-6 border-2 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105" asChild>
										<Link to="/create-performance">
											<MapPin className="w-5 h-5 mr-2" />
											Start Performing
										</Link>
									</Button>
								</>
							)}
						</div>

						{/* Stats */}
						<div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto">
							<div className="text-center group">
								<div className="text-3xl font-bold text-primary group-hover:scale-110 transition-transform duration-300">50+</div>
								<div className="text-sm text-muted-foreground">Performers</div>
							</div>
							<div className="text-center group">
								<div className="text-3xl font-bold text-secondary group-hover:scale-110 transition-transform duration-300">15+</div>
								<div className="text-sm text-muted-foreground">Cities</div>
							</div>
							<div className="text-center group">
								<div className="text-3xl font-bold text-accent group-hover:scale-110 transition-transform duration-300">1K+</div>
								<div className="text-sm text-muted-foreground">Music Lovers</div>
							</div>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section id="features" className="py-24 px-6">
					<div className="max-w-7xl mx-auto">
						<div className="text-center mb-16">
							<h2 className="text-4xl md:text-5xl font-bold mb-6">
								Supporting <span className="text-gradient">Street Artists</span> &{" "}
								<span className="text-gradient">Their Communities</span>
							</h2>
							<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
								Connecting struggling street performers with people who care. Help artists get the
								recognition and support they need to keep sharing their talents.
							</p>
						</div>

						{/* For Musicians */}
						<div className="mb-20">
							<div className="text-center mb-12">
								<h3 className="text-3xl font-bold mb-4 text-secondary">
									For Street Artists
								</h3>
								<p className="text-lg text-muted-foreground">
									Get the visibility and support you deserve for your street performances
								</p>
							</div>

							<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
								{musicianFeatures.map((feature, index) => (
									<div
										key={index}
										className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card border border-border rounded-lg p-6 text-center"
									>
										<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 text-secondary mb-4 group-hover:scale-110 transition-transform duration-300">
											{feature.icon}
										</div>
										<h4 className="text-xl font-semibold mb-3">
											{feature.title}
										</h4>
										<p className="text-muted-foreground leading-relaxed">
											{feature.description}
										</p>
									</div>
								))}
							</div>

							<div className="text-center mt-8">
								<Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl transition-all duration-300" asChild>
									<Link to="/create-performance">
										<Star className="w-5 h-5 mr-2" />
										Share Your Street Art
									</Link>
								</Button>
							</div>
						</div>

						{/* For Fans */}
						<div>
							<div className="text-center mb-12">
								<h3 className="text-3xl font-bold mb-4 text-primary">
									For Supporters
								</h3>
								<p className="text-lg text-muted-foreground">
									Help street artists in your community get the recognition they deserve
								</p>
							</div>

							<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
								{fanFeatures.map((feature, index) => (
									<div
										key={index}
										className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card border border-border rounded-lg p-6 text-center"
									>
										<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
											{feature.icon}
										</div>
										<h4 className="text-xl font-semibold mb-3">
											{feature.title}
										</h4>
										<p className="text-muted-foreground leading-relaxed">
											{feature.description}
										</p>
									</div>
								))}
							</div>

							<div className="text-center mt-8">
								<Button size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300" asChild>
									<Link to="/map">
										<MapPin className="w-5 h-5 mr-2" />
										Find Artists to Support
									</Link>
								</Button>
							</div>
						</div>
					</div>
				</section>

				{/* How It Works Section */}
				<section id="how-it-works" className="py-24 px-6 bg-card/30">
					<div className="max-w-6xl mx-auto">
						<div className="text-center mb-16">
							<h2 className="text-4xl md:text-5xl font-bold mb-6">
								How It <span className="text-gradient">Works</span>
							</h2>
							<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
								Getting started is simple. Join the street performance
								revolution in three easy steps.
							</p>
						</div>

						<div className="grid md:grid-cols-3 gap-8">
							{steps.map((step, index) => (
								<div key={index} className="relative">
									<div className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden bg-card border border-border rounded-lg">
										<div className="p-8">
											{/* Step Number */}
											<div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-bold flex items-center justify-center">
												{index + 1}
											</div>

											{/* Icon */}
											<div
												className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-background/50 ${step.color} mb-6 float-animation`}
												style={{ animationDelay: `${index * 0.5}s` }}
											>
												{step.icon}
											</div>

											{/* Content */}
											<h3 className="text-2xl font-bold mb-4">{step.title}</h3>
											<p className="text-muted-foreground leading-relaxed">
												{step.description}
											</p>
										</div>
									</div>

									{/* Connector Line */}
									{index < steps.length - 1 && (
										<div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-8 h-0.5 bg-gradient-to-r from-primary to-accent opacity-50" />
									)}
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Community Section */}
				<section id="community" className="py-24 px-6">
					<div className="max-w-6xl mx-auto">
						<div className="text-center mb-16">
							<h2 className="text-4xl md:text-5xl font-bold mb-6">
								Meet the <span className="text-gradient">Community</span>
							</h2>
							<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
								Talented artists are already sharing their music and building
								their fanbase. Join the movement and discover incredible street
								performances.
							</p>
						</div>

						<div className="grid md:grid-cols-3 gap-6 mb-12">
							{featuredPerformers.map((performer, index) => (
								<div
									key={index}
									className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden bg-card border border-border rounded-lg"
								>
									<div className="p-0">
										{/* Performance Preview */}
										<div className="relative bg-gradient-to-br from-primary/20 to-secondary/20 aspect-video flex items-center justify-center">
											<div className="text-6xl mb-4">{performer.image}</div>

											{/* Live Indicator */}
											{performer.isLive && (
												<div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 pulse-animation">
													<div className="w-2 h-2 bg-white rounded-full" />
													LIVE
												</div>
											)}

											{/* Play Button */}
											<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
												<button className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center">
													<Play className="w-6 h-6" />
												</button>
											</div>
										</div>

										{/* Performer Info */}
										<div className="p-6">
											<div className="flex items-start justify-between mb-3">
												<div>
													<h3 className="text-xl font-bold">
														{performer.name}
													</h3>
													<p className="text-muted-foreground flex items-center gap-1 text-sm">
														<Music className="w-4 h-4" />
														{performer.genre}
													</p>
												</div>
												<div className="flex items-center gap-1 text-sm text-muted-foreground">
													<Heart className="w-4 h-4 fill-current text-red-500" />
													{performer.hearts.toLocaleString()}
												</div>
											</div>

											<div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
												<MapPin className="w-4 h-4" />
												{performer.location}
											</div>

											<p className="text-sm text-muted-foreground mb-4 italic">
												{performer.description}
											</p>

											<Button variant="outline" size="sm" className="w-full hover:shadow-md transition-all duration-300">
												<ArrowRight className="w-4 h-4 mr-2" />
												View Performance
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Stats Section */}
						<div className="bg-card rounded-2xl p-8 border border-border">
							<div className="text-center mb-8">
								<h3 className="text-2xl font-bold mb-2">Growing Community</h3>
								<p className="text-muted-foreground">Real-time platform statistics</p>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
								<div className="text-center group">
									<div className="text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
										5.2K
									</div>
									<div className="text-sm text-muted-foreground">
										Performance Views
									</div>
								</div>
								<div className="text-center group">
									<div className="text-3xl font-bold text-secondary mb-2 group-hover:scale-110 transition-transform duration-300">
										1.8K
									</div>
									<div className="text-sm text-muted-foreground">
										Likes Given
									</div>
								</div>
								<div className="text-center group">
									<div className="text-3xl font-bold text-accent mb-2 group-hover:scale-110 transition-transform duration-300">
										€2.5K
									</div>
									<div className="text-sm text-muted-foreground">Tips Sent</div>
								</div>
								<div className="text-center group">
									<div className="text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
										120
									</div>
									<div className="text-sm text-muted-foreground">
										Performance Routes
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Call to Action Section */}
				<section className="py-24 px-6">
					<div className="max-w-4xl mx-auto">
						<div className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center">
							{/* Background Gradient */}
							<div className="absolute inset-0 street-gradient opacity-90" />

							{/* Background Pattern */}
							<div className="absolute inset-0 opacity-10">
								<div className="absolute top-4 left-4 w-16 h-16 border-2 border-white/30 rounded-full" />
								<div className="absolute top-12 right-8 w-8 h-8 bg-white/20 rounded-full" />
								<div className="absolute bottom-8 left-12 w-12 h-12 border border-white/30 rotate-45" />
								<div className="absolute bottom-4 right-16 w-6 h-6 bg-white/30 rounded-full" />
							</div>

							{/* Content */}
							<div className="relative z-10">
								<h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
									Ready to Join the
									<br />
									<span className="text-black/80">Street Music</span>
									<br />
									Revolution?
								</h2>

								<p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
									Whether you're a street performer looking to share your talent
									or a music lover seeking authentic live experiences, your
									journey starts here.
								</p>

								<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
									<Button size="lg" className="min-w-52 text-lg py-6 bg-white text-black hover:bg-white/90 font-bold shadow-xl transition-all duration-300 hover:scale-105" asChild>
										<Link to="/map">
											<Play className="w-5 h-5 mr-2" />
											Start Exploring
										</Link>
									</Button>

									<Button variant="outline" size="lg" className="min-w-52 text-lg py-6 border-2 border-white text-white hover:bg-white hover:text-black font-bold shadow-xl transition-all duration-300 hover:scale-105" asChild>
										<Link to="/create-performance">
											<MapPin className="w-5 h-5 mr-2" />
											Become a Performer
										</Link>
									</Button>
								</div>

								<div className="mt-8 text-white/80 text-sm">
									Join the growing community of street musicians and music enthusiasts
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="bg-card border-t border-border">
				<div className="max-w-7xl mx-auto px-6 py-12">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						{/* Brand */}
						<div className="col-span-1 md:col-span-2">
							<div className="flex items-center gap-2 mb-4">
								<div className="w-10 h-10 rounded-full street-gradient flex items-center justify-center">
									<MapPin className="w-6 h-6 text-white" />
								</div>
								<span className="text-xl font-bold">
									Street<span className="text-gradient">PerformersMap</span>
								</span>
							</div>
							<p className="text-muted-foreground max-w-md leading-relaxed">
								Connecting street performers with music lovers worldwide.
								Discover incredible talent, support local artists, and
								experience the magic of live street music.
							</p>
							<div className="flex items-center gap-4 mt-6">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Music className="w-4 h-4" />
									<span>For Musicians</span>
								</div>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Heart className="w-4 h-4" />
									<span>For Music Lovers</span>
								</div>
							</div>
						</div>

						{/* Product */}
						<div>
							<h3 className="text-lg font-semibold mb-4">Product</h3>
							<ul className="space-y-3">
								<li>
									<a
										href="#features"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Features
									</a>
								</li>
								<li>
									<a
										href="#how-it-works"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										How It Works
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Pricing
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										API
									</a>
								</li>
							</ul>
						</div>

						{/* Company */}
						<div>
							<h3 className="text-lg font-semibold mb-4">Company</h3>
							<ul className="space-y-3">
								<li>
									<a
										href="#"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										About
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Blog
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Careers
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Contact
									</a>
								</li>
							</ul>
						</div>
					</div>

					<div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
						<p className="text-muted-foreground text-sm">
							© 2024 StreetPerformersMap. All rights reserved.
						</p>
						<div className="flex items-center gap-6 mt-4 md:mt-0">
							<a
								href="#"
								className="text-muted-foreground hover:text-foreground transition-colors text-sm"
							>
								Privacy Policy
							</a>
							<a
								href="#"
								className="text-muted-foreground hover:text-foreground transition-colors text-sm"
							>
								Terms of Service
							</a>
							<a
								href="#"
								className="text-muted-foreground hover:text-foreground transition-colors text-sm"
							>
								Cookie Policy
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
