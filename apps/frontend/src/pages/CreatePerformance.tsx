import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useCreatePerformance } from '@/hooks/usePerformances';
import { GooglePlacesAutocomplete } from '@/components/GooglePlacesAutocomplete';
import { VideoUpload } from '@/components/VideoUpload';
import { useUploadEligibility, useRefreshVideoData, useLinkVideoToPerformance } from '@/hooks/useVideoUpload';
import type { CreatePerformanceDto, Video } from '@spm/shared-types';


const GENRES = ['rock', 'jazz', 'folk', 'pop', 'classical', 'blues', 'country', 'electronic', 'hip-hop', 'reggae', 'other'];

export function CreatePerformance() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const createPerformanceMutation = useCreatePerformance();
  const { data: uploadEligibility } = useUploadEligibility();
  const { refreshMyVideos } = useRefreshVideoData();
  const linkVideoMutation = useLinkVideoToPerformance();
  
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<Video | null>(null);
  
  const [formData, setFormData] = useState<CreatePerformanceDto>({
    title: '',
    description: '',
    genre: 'jazz',
    route: {
      stops: [{
        location: {
          coordinates: [-73.9712, 40.7831], // Default to Central Park
          address: 'Central Park, NYC',
          name: 'Bethesda Fountain'
        },
        startTime: '',
        endTime: ''
      }]
    },
    scheduledFor: new Date().toISOString() // Today
  });

  // Redirect if not authenticated
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-4xl mb-4">🎭</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to create performances.
          </p>
          <div className="space-y-3">
            <Link to="/" className="btn-primary w-full block text-center">
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setError(null);

    try {
      // Debug: Log the form data being sent
      console.log('Submitting form data:', JSON.stringify(formData, null, 2));
      
      // Validate that all required fields are filled
      const hasEmptyTimes = formData.route.stops.some(stop => 
        !stop.startTime || !stop.endTime || stop.startTime === '' || stop.endTime === ''
      );
      
      if (hasEmptyTimes) {
        setError('Please fill in all start and end times for your route stops');
        return;
      }

      const newPerformance = await createPerformanceMutation.mutateAsync(formData);
      
      // Debug: Log the performance and video data
      console.log('🎭 Created performance:', newPerformance);
      console.log('🎥 Uploaded video:', uploadedVideo);
      
      // If there's an uploaded video, link it to the performance
      if (uploadedVideo && newPerformance._id) {
        console.log('🔗 Attempting to link video to performance...');
        try {
          const linkedVideo = await linkVideoMutation.mutateAsync({
            videoId: uploadedVideo._id,
            performanceId: newPerformance._id,
          });
          console.log('✅ Video successfully linked to performance:', linkedVideo);
        } catch (linkError) {
          console.error('❌ Failed to link video to performance:', linkError);
          // Don't fail the entire process if video linking fails
        }
      } else {
        console.warn('⚠️ Cannot link video:', {
          hasVideo: !!uploadedVideo,
          hasPerformanceId: !!newPerformance._id,
          uploadedVideo,
          performanceId: newPerformance._id
        });
      }
      
      // Redirect to map to see the created performance
      navigate('/map');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create performance';
      setError(errorMessage);
    }
  };

  const addStop = () => {
    if (formData.route.stops.length < 5) {
      setFormData(prev => ({
        ...prev,
        route: {
          stops: [
            ...prev.route.stops,
            {
              location: {
                coordinates: [-73.9712, 40.7831],
                address: '',
                name: ''
              },
              startTime: '',
              endTime: ''
            }
          ]
        }
      }));
    }
  };

  const removeStop = (index: number) => {
    if (formData.route.stops.length > 1) {
      setFormData(prev => ({
        ...prev,
        route: {
          stops: prev.route.stops.filter((_, i) => i !== index)
        }
      }));
    }
  };

  const updateStop = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      route: {
        stops: prev.route.stops.map((stop, i) => 
          i === index 
            ? { ...stop, [field]: value }
            : stop
        )
      }
    }));
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Create New Performance</h2>
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-2">
            <div className="w-8 h-2 bg-purple-600 rounded"></div>
            <div className="w-8 h-2 bg-gray-300 rounded"></div>
            <div className="w-8 h-2 bg-gray-300 rounded"></div>
            <div className="w-8 h-2 bg-gray-300 rounded"></div>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">Step 1 of 4: Basic Info</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🎵 Performance Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          placeholder="e.g., Jazz by the Fountain"
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🎼 Genre
        </label>
        <div className="grid grid-cols-3 gap-2">
          {GENRES.map(genre => (
            <button
              key={genre}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, genre }))}
              className={`p-2 text-sm rounded-lg border transition-colors ${
                formData.genre === genre
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {genre.charAt(0).toUpperCase() + genre.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📝 Description (Optional)
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          placeholder="Tell people about your performance..."
          rows={3}
          maxLength={500}
        />
        <p className="mt-1 text-xs text-gray-500">
          {(formData.description?.length || 0)}/500 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📅 Performance Date
        </label>
        <input
          type="date"
          value={formData.scheduledFor.split('T')[0]}
          onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Plan Your Route</h2>
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-2">
            <div className="w-8 h-2 bg-purple-600 rounded"></div>
            <div className="w-8 h-2 bg-purple-600 rounded"></div>
            <div className="w-8 h-2 bg-gray-300 rounded"></div>
            <div className="w-8 h-2 bg-gray-300 rounded"></div>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">Step 2 of 4: Route Planning</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">📍 Route Stops ({formData.route.stops.length}/5 used)</h3>
        <p className="text-sm text-gray-600">Plan your performance locations and times for the day.</p>
      </div>

      <div className="space-y-4">
        {formData.route.stops.map((stop, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-900">Stop {index + 1}</h4>
              {formData.route.stops.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStop(index)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Location
                </label>
                <GooglePlacesAutocomplete
                  value={`${stop.location.name || ''} ${stop.location.address || ''}`.trim()}
                  onChange={(place) => {
                    updateStop(index, 'location', {
                      name: place.name,
                      address: place.address,
                      coordinates: place.coordinates
                    });
                  }}
                  placeholder="Search for a location (e.g., Bethesda Fountain, Central Park)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Start typing to search for locations. Coordinates will be automatically saved.
                </p>
                {stop.location.coordinates && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                    <span className="text-green-700 font-medium">📍 Location saved:</span>
                    <div className="text-green-600 mt-1">
                      Lat: {stop.location.coordinates[1].toFixed(6)}, 
                      Lng: {stop.location.coordinates[0].toFixed(6)}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={stop.startTime.split('T')[1]?.substring(0, 5) || ''}
                    onChange={(e) => {
                      const date = formData.scheduledFor.split('T')[0];
                      const datetime = `${date}T${e.target.value}:00.000Z`;
                      updateStop(index, 'startTime', datetime);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={stop.endTime.split('T')[1]?.substring(0, 5) || ''}
                    onChange={(e) => {
                      const date = formData.scheduledFor.split('T')[0];
                      const datetime = `${date}T${e.target.value}:00.000Z`;
                      updateStop(index, 'endTime', datetime);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {formData.route.stops.length < 5 && (
          <button
            type="button"
            onClick={addStop}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-500 hover:text-purple-600 transition-colors"
          >
            ➕ Add Another Stop
          </button>
        )}
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">✨ Route Tips:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Allow 15-30 min travel time between stops</li>
          <li>• Peak hours: 12-2 PM, 5-7 PM have more foot traffic</li>
          <li>• Check for permits if required in your area</li>
        </ul>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const handleVideoUploadSuccess = (video: Video) => {
      setUploadedVideo(video);
      refreshMyVideos(); // Refresh user's video cache
      console.log('Video uploaded successfully:', video);
    };

    const handleVideoUploadError = (error: string) => {
      setError(error);
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Upload Performance Video</h2>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-2">
              <div className="w-8 h-2 bg-purple-600 rounded"></div>
              <div className="w-8 h-2 bg-purple-600 rounded"></div>
              <div className="w-8 h-2 bg-purple-600 rounded"></div>
              <div className="w-8 h-2 bg-gray-300 rounded"></div>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">Step 3 of 4: Video Upload (Optional)</p>
        </div>

        {/* Success Message */}
        {uploadedVideo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-green-500 mr-3 mt-0.5">✅</div>
              <div>
                <h4 className="text-green-800 font-medium">Video Uploaded Successfully!</h4>
                <p className="text-green-700 text-sm mt-1">
                  Your video <strong>{uploadedVideo.filename}</strong> has been uploaded and will be visible to your audience.
                </p>
                <p className="text-green-600 text-xs mt-1">
                  Video expires in 24 hours • {uploadedVideo.views} views so far
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Video Upload Component */}
        <VideoUpload
          eligibility={uploadEligibility}
          onUploadSuccess={handleVideoUploadSuccess}
          onUploadError={handleVideoUploadError}
          className="max-w-2xl mx-auto"
        />

        {/* Skip Option */}
        {!uploadedVideo && (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-3">
              Don't have a video ready? No problem!
            </p>
            <p className="text-xs text-gray-500">
              You can skip this step and add a video later from your performance dashboard.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Review & Publish</h2>
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-2">
            <div className="w-8 h-2 bg-purple-600 rounded"></div>
            <div className="w-8 h-2 bg-purple-600 rounded"></div>
            <div className="w-8 h-2 bg-purple-600 rounded"></div>
            <div className="w-8 h-2 bg-purple-600 rounded"></div>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">Step 4 of 4: Review & Publish</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">🎯 Performance Summary</h3>
        
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-700">Title:</span> {formData.title}
          </div>
          <div>
            <span className="font-medium text-gray-700">Genre:</span> {formData.genre}
          </div>
          <div>
            <span className="font-medium text-gray-700">Date:</span> {formData.scheduledFor}
          </div>
          {formData.description && (
            <div>
              <span className="font-medium text-gray-700">Description:</span> {formData.description}
            </div>
          )}
        </div>

        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">📍 Route ({formData.route.stops.length} stops):</h4>
          <div className="space-y-2">
            {formData.route.stops.map((stop, index) => (
              <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                • {stop.startTime.split('T')[1]?.substring(0, 5)} - {stop.endTime.split('T')[1]?.substring(0, 5)}: {stop.location.name || stop.location.address}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">⚠️ Important:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Performance will auto-delete after 24 hours</li>
          <li>• You can update location during performance</li>
          <li>• Check local regulations for street performing</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="btn-secondary"
                >
                  ← Back
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <Link to="/map" className="btn-secondary">
                Cancel
              </Link>
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !formData.title) ||
                    (step === 2 && formData.route.stops.some(stop => 
                      !stop.startTime || !stop.endTime || 
                      stop.startTime === '' || stop.endTime === '' ||
                      !stop.location.address || stop.location.address === ''
                    ))
                  }
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: {step === 1 ? 'Route' : step === 2 ? 'Video' : 'Review'} →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createPerformanceMutation.isPending}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createPerformanceMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Publishing...
                    </>
                  ) : (
                    '🚀 Publish Performance'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
