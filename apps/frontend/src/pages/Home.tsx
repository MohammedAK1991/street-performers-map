import { Link } from 'react-router-dom';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { Play, MapPin, Heart, Menu, Video, Route, TrendingUp, DollarSign, Filter, Timer, Users, Music } from 'lucide-react';
import { useState } from 'react';
import heroImage from '../assets/hero-street-performance.jpg';

export function Home() {
  const { user: clerkUser, isSignedIn } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Determine if user is authenticated
  const isAuthenticated = isSignedIn && !!clerkUser;

  const musicianFeatures = [
    {
      icon: <Video className="w-8 h-8" />,
      title: "Share Your Performance",
      description: "Upload 30-second videos of your street performances. Two videos per day, refreshed daily for a dynamic experience."
    },
    {
      icon: <Route className="w-8 h-8" />,
      title: "Plan Your Route",
      description: "Set up to 5 performance stops with scheduled times. Your route gets highlighted on the interactive map for fans to follow."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Build Your Following",
      description: "Gain hearts from fans and climb the trending performers leaderboard. Get featured in stories feeds across the platform."
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Receive Tips",
      description: "Connect with fans who appreciate your art. Receive digital tips directly through the platform's integrated payment system."
    }
  ];

  const fanFeatures = [
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Discover Live Performances",
      description: "Find street performances happening near you in real-time. Markers change size and color based on popularity and timing."
    },
    {
      icon: <Filter className="w-8 h-8" />,
      title: "Filter by Your Taste",
      description: "Search by genre, time, location, and more. Find exactly the type of performance you're in the mood for."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Support Artists",
      description: "Heart performances you love and help talented musicians gain visibility. Your engagement helps build the community."
    },
    {
      icon: <Timer className="w-8 h-8" />,
      title: "Never Miss a Show",
      description: "Get notified about performances starting soon. Plan your day around the artists you want to see."
    }
  ];

  const steps = [
    {
      icon: <MapPin className="w-12 h-12" />,
      title: "Set Your Location",
      description: "Allow location access to discover street performances happening around you or set your performance route.",
      color: "text-primary"
    },
    {
      icon: <Video className="w-12 h-12" />,
      title: "Create or Discover",
      description: "Musicians upload 30-second performance videos and set their schedule. Fans browse and filter by genre, time, and location.",
      color: "text-secondary"
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "Connect & Support",
      description: "Heart performances you love, follow your favorite artists, and support them with digital tips. Build the street music community.",
      color: "text-accent"
    }
  ];

  const featuredPerformers = [
    {
      name: "Maya Rodriguez",
      genre: "Acoustic Folk",
      location: "Washington Square Park",
      hearts: 1247,
      isLive: true,
      image: "🎸"
    },
    {
      name: "Jazz Collective",
      genre: "Jazz Fusion",
      location: "Union Square",
      hearts: 892,
      isLive: false,
      image: "🎷"
    },
    {
      name: "Street Beats",
      genre: "Hip Hop",
      location: "Times Square",
      hearts: 2156,
      isLive: true,
      image: "🥁"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full street-gradient flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">
                Street<span className="text-gradient">PerformersMap</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#community" className="text-muted-foreground hover:text-foreground transition-colors">
                Community
              </a>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/map" className="text-muted-foreground hover:text-foreground transition-colors">
                    View Map
                  </Link>
                  <span className="text-muted-foreground">
                    Welcome, {clerkUser?.fullName || clerkUser?.username}!
                  </span>
                  <UserButton afterSignOutUrl="/" />
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors">
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
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                  Features
                </a>
                <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                  How It Works
                </a>
                <a href="#community" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                  Community
                </a>
                <div className="flex flex-col gap-2 mt-4">
                  {isAuthenticated ? (
                    <>
                      <Link to="/map" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                        View Map
                      </Link>
                      <span className="text-muted-foreground py-2">
                        Welcome, {clerkUser?.fullName || clerkUser?.username}!
                      </span>
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
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src={heroImage} 
              alt="Street performer playing guitar in urban setting"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-20 left-10 opacity-70 float-animation">
            <div className="bg-accent/20 rounded-full p-3 backdrop-blur-sm">
              <Play className="w-6 h-6 text-accent" />
            </div>
          </div>
          
          <div className="absolute top-32 right-16 opacity-70 float-animation" style={{ animationDelay: "1s" }}>
            <div className="bg-primary/20 rounded-full p-3 backdrop-blur-sm">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
          </div>
          
          <div className="absolute bottom-32 left-20 opacity-70 float-animation" style={{ animationDelay: "2s" }}>
            <div className="bg-secondary/20 rounded-full p-3 backdrop-blur-sm">
              <Heart className="w-6 h-6 text-secondary" />
            </div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
            <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
              <span className="text-gradient">Street</span>
              <br />
              <span className="text-foreground">Performers</span>
              <br />
              <span className="text-gradient">Map</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Discover live street performances around you. Connect with talented musicians, 
              find amazing shows, and support street artists in your city.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isAuthenticated ? (
                <Link to="/map">
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-lg font-bold text-lg transition-colors min-w-48 flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    Find Performances
                  </button>
                </Link>
              ) : (
                <>
                  <SignUpButton mode="modal">
                    <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-lg font-bold text-lg transition-colors min-w-48 flex items-center justify-center gap-2">
                      <Play className="w-5 h-5" />
                      Find Performances
                    </button>
                  </SignUpButton>
                  
                  <Link to="/create-performance">
                    <button className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 rounded-lg font-bold text-lg transition-colors min-w-48 flex items-center justify-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Start Performing
                    </button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Performers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">50+</div>
                <div className="text-sm text-muted-foreground">Cities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">10K+</div>
                <div className="text-sm text-muted-foreground">Fans</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Built for <span className="text-gradient">Musicians</span> & <span className="text-gradient">Music Lovers</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Whether you're performing on the streets or seeking amazing live music, 
                StreetPerformersMap connects the creative community like never before.
              </p>
            </div>

            {/* For Musicians */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold mb-4 text-secondary">For Street Musicians</h3>
                <p className="text-lg text-muted-foreground">Share your talent, build your audience, earn support</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {musicianFeatures.map((feature, index) => (
                  <div key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card border border-border rounded-lg p-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 text-secondary mb-4 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h4 className="text-xl font-semibold mb-3">{feature.title}</h4>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <Link to="/create-performance">
                  <button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 rounded-lg font-bold text-lg transition-colors">
                    Start Performing Today
                  </button>
                </Link>
              </div>
            </div>

            {/* For Fans */}
            <div>
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold mb-4 text-primary">For Music Lovers</h3>
                <p className="text-lg text-muted-foreground">Discover incredible talent in your neighborhood</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {fanFeatures.map((feature, index) => (
                  <div key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card border border-border rounded-lg p-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h4 className="text-xl font-semibold mb-3">{feature.title}</h4>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <Link to="/map">
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-bold text-lg transition-colors">
                    Explore Performances
                  </button>
                </Link>
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
                Getting started is simple. Join the street performance revolution in three easy steps.
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
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-background/50 ${step.color} mb-6 float-animation`} style={{ animationDelay: `${index * 0.5}s` }}>
                        {step.icon}
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{step.description}</p>
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
                Talented artists are already sharing their music and building their fanbase. 
                Join the movement and discover incredible street performances.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {featuredPerformers.map((performer, index) => (
                <div key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden bg-card border border-border rounded-lg">
                  <div className="p-0">
                    {/* Performance Preview */}
                    <div className="relative bg-gradient-to-br from-primary/20 to-secondary/20 aspect-video flex items-center justify-center">
                      <div className="text-6xl mb-4">{performer.image}</div>
                      
                      {/* Live Indicator */}
                      {performer.isLive && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 pulse-animation">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
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
                          <h3 className="text-xl font-bold">{performer.name}</h3>
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
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                        <MapPin className="w-4 h-4" />
                        {performer.location}
                      </div>
                      
                      <button className="w-full border border-border text-foreground hover:bg-muted px-4 py-2 rounded-lg transition-colors">
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Section */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">2.5M</div>
                  <div className="text-sm text-muted-foreground">Videos Watched</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary mb-2">850K</div>
                  <div className="text-sm text-muted-foreground">Hearts Given</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">$125K</div>
                  <div className="text-sm text-muted-foreground">Tips Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">15K</div>
                  <div className="text-sm text-muted-foreground">Routes Created</div>
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
                  Whether you're a street performer looking to share your talent or a music lover 
                  seeking authentic live experiences, your journey starts here.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link to="/map">
                    <button className="min-w-52 text-lg py-6 bg-white text-black hover:bg-white/90 font-bold shadow-xl rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Play className="w-5 h-5" />
                      Start Exploring
                    </button>
                  </Link>
                  
                  <Link to="/create-performance">
                    <button className="min-w-52 text-lg py-6 border-2 border-white text-white hover:bg-white hover:text-black font-bold shadow-xl rounded-lg transition-colors flex items-center justify-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Become a Performer
                    </button>
                  </Link>
                </div>
                
                <div className="mt-8 text-white/80 text-sm">
                  Join thousands of musicians and music lovers already on the platform
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
                Discover incredible talent, support local artists, and experience 
                the magic of live street music.
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
                <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 StreetPerformersMap. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}