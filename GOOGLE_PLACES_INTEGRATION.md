# 🗺️ Google Places Integration

## Overview
The StreetPerformersMap app now includes Google Places Autocomplete for location search in the performance creation flow. This allows users to search for locations and automatically get accurate coordinates.

## Features Implemented

### ✅ Google Places Autocomplete Component
- **File**: `apps/frontend/src/components/GooglePlacesAutocomplete.tsx`
- **Features**:
  - Real-time location search as user types
  - Automatic coordinate extraction (lat/lng)
  - Place name and formatted address
  - Loading state with spinner
  - Error handling for API failures

### ✅ Integration with Performance Creation
- **File**: `apps/frontend/src/pages/CreatePerformance.tsx`
- **Features**:
  - Replaced manual address input with Google Places search
  - Automatic coordinate saving to database
  - Visual confirmation when coordinates are saved
  - Support for multiple route stops (up to 5)

## How It Works

1. **User starts typing** in the location search field
2. **Google Places API** provides real-time suggestions
3. **User selects a location** from the dropdown
4. **Coordinates are automatically extracted** and saved
5. **Visual confirmation** shows the saved coordinates
6. **Data is stored** in MongoDB with the performance

## Environment Setup

Add your Google Maps API key to `.env`:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## API Requirements

- **Google Maps JavaScript API** with Places library enabled
- **Places API** must be enabled in Google Cloud Console
- **Billing** must be set up for the API key

## Data Structure

When a location is selected, the following data is saved:

```typescript
{
  location: {
    name: "Bethesda Fountain",
    address: "Central Park, New York, NY, USA",
    coordinates: [-73.9712, 40.7831] // [lng, lat]
  }
}
```

## Usage Example

```tsx
<GooglePlacesAutocomplete
  value={locationDisplay}
  onChange={(place) => {
    // place.name: "Bethesda Fountain"
    // place.address: "Central Park, New York, NY, USA"
    // place.coordinates: [-73.9712, 40.7831]
  }}
  placeholder="Search for a location..."
/>
```

## Benefits

1. **Accuracy**: Google's extensive location database
2. **User Experience**: No manual coordinate entry
3. **Consistency**: Standardized address formatting
4. **Real-time**: Instant search results
5. **Mobile-friendly**: Works on all devices

## Next Steps

- [ ] Add location validation
- [ ] Implement location history
- [ ] Add map preview for selected locations
- [ ] Support for custom location pins
