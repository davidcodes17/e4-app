/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 - First point latitude
 * @param lng1 - First point longitude
 * @param lat2 - Second point latitude
 * @param lng2 - Second point longitude
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

/**
 * Check if driver has deviated significantly from route
 * @param currentLat - Current driver latitude
 * @param currentLng - Current driver longitude
 * @param routeCoordinates - Array of route coordinates
 * @param deviationThreshold - Maximum allowed deviation in meters (default 100m)
 * @returns True if deviated beyond threshold
 */
export function hasDeviatedFromRoute(
  currentLat: number,
  currentLng: number,
  routeCoordinates: Array<{ latitude: number; longitude: number }>,
  deviationThreshold: number = 100,
): boolean {
  if (routeCoordinates.length === 0) return false;

  // Find minimum distance to any point on the route
  let minDistance = Infinity;
  for (const coord of routeCoordinates) {
    const distance = calculateDistance(
      currentLat,
      currentLng,
      coord.latitude,
      coord.longitude,
    );
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance > deviationThreshold;
}
