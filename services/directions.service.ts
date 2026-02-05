import axios from "axios";

// OSRM (Open Route Service Machine) - Free routing API
// No API key required, great for turn-by-turn directions
const OSRM_BASE_URL = "https://router.project-osrm.org";

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

interface RouteStep {
  name: string;
  distance: number;
  duration: number;
  instruction: string;
}

interface DirectionResponse {
  coordinates: RouteCoordinate[];
  distance: number; // in kilometers
  duration: number; // in seconds
  steps: RouteStep[];
}

export const DirectionsService = {
  /**
   * Get route directions between two points
   * Uses OSRM (Open Route Service Machine) - Free API
   * Returns polyline coordinates and turn-by-turn directions
   */
  async getDirections(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ): Promise<DirectionResponse | null> {
    try {
      // OSRM expects coordinates in lng,lat format
      const startCoords = `${startLng},${startLat}`;
      const endCoords = `${endLng},${endLat}`;

      // Use OSRM route service
      const response = await axios.get(
        `${OSRM_BASE_URL}/route/v1/driving/${startCoords};${endCoords}`,
        {
          params: {
            overview: "full", // Get full route geometry
            steps: "true", // Get turn-by-turn instructions
            geometries: "geojson", // Return GeoJSON format
            annotations: "distance,duration",
          },
          timeout: 10000,
        },
      );

      if (response.data.code === "Ok" && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const coordinates = route.geometry.coordinates.map(
          (coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }),
        );

        // Extract turn-by-turn directions
        const steps: RouteStep[] = [];
        if (route.legs && route.legs.length > 0) {
          route.legs.forEach((leg: any) => {
            if (leg.steps && Array.isArray(leg.steps)) {
              leg.steps.forEach((step: any) => {
                steps.push({
                  name: step.name || "Road",
                  distance: Math.round(step.distance),
                  duration: Math.round(step.duration),
                  instruction: step.maneuver?.instruction || "Continue",
                });
              });
            }
          });
        }

        return {
          coordinates,
          distance: Math.round(route.distance / 1000), // Convert to km
          duration: Math.round(route.duration), // In seconds
          steps,
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching directions:", error);
      return null;
    }
  },

  /**
   * Calculate estimated fare based on distance
   * Simple calculation: base fare + per-km charge
   */
  calculateFare(distanceKm: number, durationSeconds: number): number {
    const baseFare = 500; // NGN
    const perKmRate = 200; // NGN per km
    const perMinuteRate = 50; // NGN per minute

    const distanceFare = distanceKm * perKmRate;
    const durationFare = (durationSeconds / 60) * perMinuteRate;

    return Math.round(baseFare + distanceFare + durationFare);
  },

  /**
   * Format duration for display
   * Returns human-readable string like "15 mins" or "1 hr 30 mins"
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} hr${hours > 1 ? "s" : ""} ${minutes} min${minutes !== 1 ? "s" : ""}`;
    }
    return `${minutes} min${minutes !== 1 ? "s" : ""}`;
  },

  /**
   * Format distance for display
   * Returns string like "5.2 km"
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm >= 1) {
      return `${distanceKm.toFixed(1)} km`;
    }
    return `${Math.round(distanceKm * 1000)} m`;
  },
};
