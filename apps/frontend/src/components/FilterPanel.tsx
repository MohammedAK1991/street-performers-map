interface FilterPanelProps {
  filters: {
    genre: string;
    timeRange: string;
    distance: number;
    popularity: string;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

const GENRES = ['all', 'jazz', 'rock', 'folk', 'pop', 'classical', 'blues', 'other'];
const TIME_RANGES = [
  { value: 'now', label: 'Live Now' },
  { value: 'hour', label: 'Next Hour' },
  { value: 'today', label: 'Today' },
  { value: 'all', label: 'All Time' }
];
const DISTANCES = [1, 2, 5, 10, 25];

export function FilterPanel({ filters, onFiltersChange, onClose }: FilterPanelProps) {
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">🔍 Find Performances</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Genre Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            🎵 Genre
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => handleFilterChange('genre', genre)}
                className={`p-2 text-sm rounded-lg border transition-colors ${
                  filters.genre === genre
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {genre.charAt(0).toUpperCase() + genre.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Time Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ⏰ Time
          </label>
          <div className="space-y-2">
            {TIME_RANGES.map(timeRange => (
              <button
                key={timeRange.value}
                onClick={() => handleFilterChange('timeRange', timeRange.value)}
                className={`w-full p-3 text-sm rounded-lg border transition-colors text-left ${
                  filters.timeRange === timeRange.value
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {timeRange.label}
              </button>
            ))}
          </div>
        </div>

        {/* Distance Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            📍 Distance
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DISTANCES.map(distance => (
              <button
                key={distance}
                onClick={() => handleFilterChange('distance', distance)}
                className={`p-2 text-sm rounded-lg border transition-colors ${
                  filters.distance === distance
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {distance}km
              </button>
            ))}
          </div>
        </div>

        {/* Popularity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            🔥 Popularity
          </label>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All Performances' },
              { value: 'trending', label: 'Trending Now' },
              { value: 'popular', label: 'Most Popular' },
              { value: 'new', label: 'New Performers' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('popularity', option.value)}
                className={`w-full p-3 text-sm rounded-lg border transition-colors text-left ${
                  filters.popularity === option.value
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => onFiltersChange({
              genre: 'all',
              timeRange: 'all',
              distance: 5,
              popularity: 'all'
            })}
            className="w-full btn-secondary"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-600 text-center">
          Filter performances by genre and time
        </p>
      </div>
    </div>
  );
}
