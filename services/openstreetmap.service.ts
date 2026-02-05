import axios from "axios";

// Nominatim API - Free and no API key required
// Rate limit: 1 request per second (sufficient for this use case)
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "E4RideApp/1.0"; // Required by Nominatim

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  address?: any;
  type?: string;
}

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

export const OpenStreetMapService = {
  /**
   * Get place suggestions using Nominatim
   * Free, no API key required
   */
  async getPlacePredictions(
    input: string,
    location?: { latitude: number; longitude: number },
    radius: number = 50000,
  ): Promise<PlacePrediction[]> {
    if (!input || input.length < 2) {
      return [];
    }

    try {
      const params: any = {
        q: input,
        format: "json",
        addressdetails: 1,
        limit: 8,
        "accept-language": "en",
      };

      // Add location bias for better nearby results
      if (location) {
        params.viewbox = `${location.longitude - 0.5},${location.latitude - 0.5},${
          location.longitude + 0.5
        },${location.latitude + 0.5}`;
        params.bounded = 1;
      }

      // Add Nigeria country focus for better local results
      params.countrycodes = "ng";

      const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
        params,
        headers: {
          "User-Agent": USER_AGENT,
        },
        timeout: 5000,
      });

      if (Array.isArray(response.data)) {
        return response.data.map((result: NominatimResult) => {
          // Extract main and secondary text from display_name
          const parts = result.display_name.split(",");
          const main_text = parts[0].trim();
          const secondary_text = parts.slice(1).join(",").trim();

          return {
            place_id: result.place_id.toString(),
            description: result.display_name,
            main_text,
            secondary_text,
          };
        });
      }

      return [];
    } catch (error) {
      console.error("Error fetching place predictions:", error);
      return [];
    }
  },

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!placeId) {
      return null;
    }

    try {
      const response = await axios.get(`${NOMINATIM_BASE_URL}/details`, {
        params: {
          osm_id: placeId,
          format: "json",
          addressdetails: 1,
        },
        headers: {
          "User-Agent": USER_AGENT,
        },
        timeout: 5000,
      });

      if (response.data) {
        const result = response.data;
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          name: result.name || result.display_name.split(",")[0],
          address: result.display_name,
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
   */
  async getAddressFromCoordinates(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    try {
      const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
          format: "json",
          zoom: 18,
          addressdetails: 1,
        },
        headers: {
          "User-Agent": USER_AGENT,
        },
        timeout: 5000,
      });

      if (response.data?.display_name) {
        return response.data.display_name;
      }

      return null;
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return null;
    }
  },

  /**
   * Get nearby places based on location and amenity type
   * Uses Overpass API for nearby amenities
   */
  async getNearbyPlaces(
    latitude: number,
    longitude: number,
    amenityType: string = "all", // all, restaurant, mall, airport, etc.
    radius: number = 5000,
  ): Promise<PlaceDetails[]> {
    try {
      // Convert radius to degrees (approximate)
      const radiusDegrees = radius / 111000;

      // Build query based on amenity type
      let amenityQuery = "";
      switch (amenityType) {
        case "restaurant":
          amenityQuery = "amenity=restaurant";
          break;
        case "mall":
          amenityQuery = "shop=mall";
          break;
        case "airport":
          amenityQuery = "aeroway=aerodrome";
          break;
        case "hotel":
          amenityQuery = "tourism=hotel";
          break;
        default:
          // All amenities
          amenityQuery = "amenity~.";
      }

      const bbox = `${latitude - radiusDegrees},${longitude - radiusDegrees},${
        latitude + radiusDegrees
      },${longitude + radiusDegrees}`;

      // Use Overpass API for nearby places
      const overpassQuery = `[out:json];(node[${amenityQuery}](${bbox});way[${amenityQuery}](${bbox}););out geom;`;

      const response = await axios.get(
        "https://overpass-api.de/api/interpreter",
        {
          params: { data: overpassQuery },
          timeout: 10000,
        },
      );

      const places: PlaceDetails[] = [];

      if (response.data.elements) {
        response.data.elements.slice(0, 5).forEach((element: any) => {
          let lat = element.lat;
          let lon = element.lon;
          let name = element.tags?.name || "Unnamed Place";

          // For ways, get center point
          if (!lat && element.center) {
            lat = element.center.lat;
            lon = element.center.lon;
          }

          if (lat && lon) {
            places.push({
              latitude: lat,
              longitude: lon,
              name,
              address: `${name}, Nigeria`,
              placeId: `osm-${element.id}`,
            });
          }
        });
      }

      return places;
    } catch (error) {
      console.error("Error fetching nearby places:", error);
      return [];
    }
  },

  /**
   * Search for specific point of interest types
   * More flexible than getNearbyPlaces
   */
  async searchNearbyAmenities(
    latitude: number,
    longitude: number,
    types: string[] = ["restaurant", "cafe", "shopping_mall"],
    radius: number = 3000,
  ): Promise<PlaceDetails[]> {
    try {
      const radiusDegrees = radius / 111000;

      const placesMap = new Map<string, PlaceDetails>();

      for (const type of types) {
        let amenityQuery = "";
        switch (type) {
          case "restaurant":
            amenityQuery = "amenity=restaurant";
            break;
          case "cafe":
            amenityQuery = "amenity=cafe";
            break;
          case "shopping_mall":
            amenityQuery = "shop=mall";
            break;
          case "supermarket":
            amenityQuery = "shop=supermarket";
            break;
          case "fuel":
            amenityQuery = "amenity=fuel";
            break;
          default:
            continue;
        }

        const bbox = `${latitude - radiusDegrees},${longitude - radiusDegrees},${
          latitude + radiusDegrees
        },${longitude + radiusDegrees}`;

        const overpassQuery = `[out:json];(node[${amenityQuery}](${bbox});way[${amenityQuery}](${bbox}););out geom;`;

        try {
          const response = await axios.get(
            "https://overpass-api.de/api/interpreter",
            {
              params: { data: overpassQuery },
              timeout: 10000,
            },
          );

          if (response.data.elements) {
            response.data.elements.forEach((element: any) => {
              let lat = element.lat;
              let lon = element.lon;
              let name = element.tags?.name || `${type}`;

              if (!lat && element.center) {
                lat = element.center.lat;
                lon = element.center.lon;
              }

              if (
                lat &&
                lon &&
                !placesMap.has(element.id?.toString() || name)
              ) {
                placesMap.set(element.id?.toString() || name, {
                  latitude: lat,
                  longitude: lon,
                  name,
                  address: `${name}, Lagos, Nigeria`,
                  placeId: `osm-${element.id}`,
                });
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching ${type} amenities:`, error);
        }
      }

      return Array.from(placesMap.values()).slice(0, 5);
    } catch (error) {
      console.error("Error searching nearby amenities:", error);
      return [];
    }
  },
};
