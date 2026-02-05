# Google Maps Setup Guide

This document explains how to set up and configure Google Maps API for location suggestions in the E4 app.

## 🔑 Getting Your Google Maps API Key

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account (or create one)
3. Click the project dropdown at the top
4. Click "NEW PROJECT"
5. Enter project name: "E4 Ride App" (or similar)
6. Click "CREATE"

### 2. Enable Required APIs

1. In the Cloud Console, search for these APIs in the search bar and enable each:
   - **Google Places API**
   - **Maps JavaScript API**
   - **Geocoding API**
2. For each API:
   - Click on it
   - Click "ENABLE"

### 3. Create API Key

1. Go to **Credentials** (left menu)
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the generated API key
4. Click **"Edit API Key"** to restrict it:
   - Under "API restrictions": Select "Google Places API", "Maps JavaScript API", "Geocoding API"
   - Under "Application restrictions": Select "Android apps" or "iOS apps" as needed
   - Add your app package name/bundle ID

### 4. Add API Key to Your Project

#### Option A: Using Environment Variables (Recommended)

Create a `.env.local` file in the project root:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key-here
```

#### Option B: Using .env

Create a `.env` file:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key-here
```

### 5. Verify Setup

The app will automatically use your API key for:

- **Autocomplete suggestions** - as users type pickup/destination
- **Place details** - getting exact coordinates
- **Reverse geocoding** - converting coordinates to addresses
- **Nearby places** - showing popular locations

## 🚗 How It Works

### Location Suggestions Feature

When users type in the pickup or destination field:

1. **Pickup Field** - Filters suggestions from:
   - Saved locations (Home, Work)
   - Recent locations
   - Google Places autocomplete results

2. **Destination Field** - Filters suggestions from:
   - Saved locations (Home, Work)
   - Recent locations
   - Popular nearby places
   - Google Places autocomplete results

### Default Suggestions

When users focus on the destination field without typing:

- Shows nearby points of interest (restaurants, malls, airports, etc.)
- Sorted by proximity to user's current location

## 📝 Service Methods

### GooglePlacesService

**`getPlacePredictions(input, sessionToken?, location?, radius?)`**

- Gets autocomplete suggestions as user types
- Biased to user's current location
- Returns: Array of suggestions with `place_id`, `main_text`, `secondary_text`

**`getPlaceDetails(placeId)`**

- Gets full details for a selected place
- Returns: Coordinates, formatted address, place name

**`getAddressFromCoordinates(latitude, longitude)`**

- Reverse geocodes coordinates to address
- Returns: Formatted address string

**`getNearbyPlaces(latitude, longitude, type?, radius?)`**

- Finds popular places near a location
- Returns: Array of nearby places with coordinates

## 🔒 Security Best Practices

1. **Restrict your API Key**:
   - Only enable required APIs
   - Set package name/bundle ID restrictions
   - Set HTTP referer restrictions if using web

2. **Use API Key Quotas**:
   - Set daily quotas in Cloud Console
   - Prevent unexpected charges

3. **Monitor Usage**:
   - Check [Google Cloud Console Billing](https://console.cloud.google.com/billing)
   - Review API usage in Quotas page

## 💰 Pricing

Google Places API pricing (as of 2024):

- **Autocomplete requests**: $0.0032 per request (first 100,000/month free)
- **Place Details**: $0.017 per request (first 100,000/month free)
- **Geocoding**: $0.005 per request (first 40,000/month free)

For a typical ride-sharing app with 1000 daily users, costs would be minimal in the free tier.

## 🐛 Troubleshooting

### Suggestions not appearing?

- Check API key is set in `.env`
- Verify APIs are enabled in Cloud Console
- Check browser console for error messages
- Ensure Android/iOS package name matches credentials

### Getting "REQUEST_DENIED" error?

- Verify API key is correct
- Check that required APIs are enabled
- Ensure package name/bundle ID is added to restrictions

### High costs?

- Check which APIs are being called most
- Implement caching for recent searches
- Set daily quotas in Cloud Console

## 📚 Resources

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Quotas & Limits](https://developers.google.com/maps/billing-and-pricing/pricing)

## 🎯 Next Steps

1. ✅ Set up Google Cloud Project
2. ✅ Enable required APIs
3. ✅ Create and restrict API key
4. ✅ Add to `.env.local` file
5. ✅ Test location suggestions in app
6. ✅ Monitor usage and costs

**Your location suggestions are now powered by real-time Google Maps data! 🗺️**
