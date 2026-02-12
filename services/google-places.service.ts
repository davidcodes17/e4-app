import axios from "axios";

// Get your API key from Google Cloud Console
// Make sure to enable Google Places API, Maps JavaScript API
const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  "AIzaSyAqehj9okkEIzLDLjCgwzMl_geFYvZmdUc";

interface PlacePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text?: string;
}

interface PlaceDetails {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  placeId: string;
}

export const GooglePlacesService = {
  /**
   * Get place suggestions based on search input
   * Uses Google Places Autocomplete API
   */
  async getPlacePredictions(
    input: string,
    sessionToken?: string,
    location?: { latitude: number; longitude: number },
    radius: number = 50000, // 50km default
  ): Promise<PlacePrediction[]> {
    if (!input || input.length < 2) {
      return [];
    }

    if (!GOOGLE_PLACES_API_KEY) {
      console.warn(
        "Google Maps API key not configured. Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env",
      );
      return [];
    }

    try {
      const params: any = {
        input,
        key: GOOGLE_PLACES_API_KEY,
        components: "country:ng", // Nigeria only - adjust based on your needs
        language: "en",
      };

      // Add location bias for better results
      if (location) {
        params.location = `${location.latitude},${location.longitude}`;
        params.radius = radius;
      }

      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/place/autocomplete/json",
        { params },
      );

      if (response.data.status === "OK") {
        return response.data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          main_text: prediction.structured_formatting.main_text,
          secondary_text: prediction.structured_formatting.secondary_text || "",
        }));
      }

      return [];
    } catch (error) {
      console.error("Error fetching place predictions:", error);
      return [];
    }
  },

  /**
   * Get detailed information about a specific place
   * Includes coordinates and full address
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!placeId || !GOOGLE_PLACES_API_KEY) {
      return null;
    }

    try {
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/place/details/json",
        {
          params: {
            place_id: placeId,
            fields: "geometry,formatted_address,name,address_component,type",
            key: GOOGLE_PLACES_API_KEY,
          },
        },
      );

      if (response.data.status === "OK") {
        const result = response.data.result;
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          name: result.name,
          address: result.formatted_address,
          placeId: placeId,
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching place details:", error);
      return null;
    }
  },

  /**
   * Reverse geocode coordinates to get address
   * Uses Google Geocoding API
   */
  async getAddressFromCoordinates(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    if (!GOOGLE_PLACES_API_KEY) {
      return null;
    }

    try {
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        {
          params: {
            latlng: `${latitude},${longitude}`,
            key: GOOGLE_PLACES_API_KEY,
          },
        },
      );

      if (response.data.status === "OK" && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }

      return null;
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return null;
    }
  },

  /**
   * Get nearby places based on location and type
   * Useful for showing popular places
   */
  async getNearbyPlaces(
    latitude: number,
    longitude: number,
    type: string = "point_of_interest",
    radius: number = 5000,
  ): Promise<PlaceDetails[]> {
    if (!GOOGLE_PLACES_API_KEY) {
      return [];
    }

    try {
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
        {
          params: {
            location: `${latitude},${longitude}`,
            radius,
            type,
            key: GOOGLE_PLACES_API_KEY,
          },
        },
      );

      if (response.data.status === "OK") {
        return response.data.results.slice(0, 5).map((place: any) => ({
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          name: place.name,
          address: place.vicinity,
          placeId: place.place_id,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error fetching nearby places:", error);
      return [];
    }
  },
};
