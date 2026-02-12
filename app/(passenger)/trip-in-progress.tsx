import { InlineLoader } from "@/components/common/loaders";
import { useToast } from "@/components/common/toast-provider";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { DirectionsService } from "@/services/directions.service";
import { RideService } from "@/services/ride.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

/**
 * PassengerTripInProgressScreen - Active Trip Tracking for Passengers
 *
 * IMPLEMENTATION:
 * - Polls trip live state every 4 seconds to track driver location
 * - Displays driver marker and follows driver location
 * - Passenger location not required anymore during trip
 * - Allows passenger to end trip (navigates to review screen)
 *
 * API Endpoints Used:
 * - GET /api/rides/{rideId}/live - Poll trip state and driver location
 * - POST /api/rides/{rideId}/end - End trip
 */

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export default function PassengerTripInProgressScreen() {
  const router = useRouter();
  const toast = useToast();
  const { rideId, driverName, pickupLat, pickupLng, dropOffLat, dropOffLng } =
    useLocalSearchParams<{
      rideId: string;
      driverName: string;
      pickupLat: string;
      pickupLng: string;
      dropOffLat: string;
      dropOffLng: string;
    }>();

  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [tripRoute, setTripRoute] = useState<RouteCoordinate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tripStatus, setTripStatus] = useState<string>("IN_PROGRESS");
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<string>("");
  const [eta, setEta] = useState<string | null>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const pickupCoords = {
    latitude: parseFloat(pickupLat || "6.5244"),
    longitude: parseFloat(pickupLng || "3.3792"),
  };

  const dropOffCoords = {
    latitude: parseFloat(dropOffLat || "6.5244"),
    longitude: parseFloat(dropOffLng || "3.3792"),
  };

  // ============= TRIP STATE POLLING =============
  // Poll trip live state every 4 seconds to track driver location
  useEffect(() => {
    if (!rideId) return;

    const fetchTripLiveState = async () => {
      try {
        const response = await RideService.getLiveRideState(rideId);

        if (response.success && response.data) {
          const liveState = response.data;
          console.log(`📊 Trip Status: ${liveState.status}`);

          setTripStatus(liveState.status);

          // Update driver location if available
          if (liveState.driverLocation) {
            setDriverLocation({
              latitude: liveState.driverLocation.latitude,
              longitude: liveState.driverLocation.longitude,
            });
          }

          // Stop polling if trip is completed
          if (liveState.status === "COMPLETED") {
            console.log("✅ Trip completed");

            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            toast.show({
              type: "success",
              title: "Trip completed",
              message: "Please rate your experience.",
            });

            // Navigate to review screen
            setTimeout(() => {
              router.replace({
                pathname: "/(passenger)/review",
                params: { rideId, driverName },
              });
            }, 1500);
          }
        }
      } catch (error) {
        console.error("❌ Failed to fetch trip state:", error);
      }
    };

    // Start polling every 4 seconds
    pollingIntervalRef.current = setInterval(fetchTripLiveState, 4000);

    // Initial poll immediately
    fetchTripLiveState();

    return () => {
      if (pollingIntervalRef.current) {
        console.log("🛑 Stopping trip state polling");
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [rideId]);

  // ============= CALCULATE TRIP ROUTE =============
  // Calculate route from pickup to drop-off location
  useEffect(() => {
    const calculateRoute = async () => {
      try {
        const directions = await DirectionsService.getDirections(
          pickupCoords.latitude,
          pickupCoords.longitude,
          dropOffCoords.latitude,
          dropOffCoords.longitude,
        );

        if (directions) {
          setTripRoute(directions.coordinates);
          setDistance(directions.distance);
          setDuration(DirectionsService.formatDuration(directions.duration));
          console.log(`✅ Trip route calculated: ${directions.distance}km`);
        }
      } catch (error) {
        console.error("❌ Failed to calculate route:", error);
        // Fallback to simple line
        setTripRoute([pickupCoords, dropOffCoords]);
      }
    };

    calculateRoute();
  }, [pickupLat, pickupLng, dropOffLat, dropOffLng]);

  // ============= CALCULATE ETA =============
  // Calculate ETA from driver location to drop-off
  useEffect(() => {
    if (driverLocation && dropOffCoords) {
      const calculateEta = async () => {
        try {
          const directions = await DirectionsService.getDirections(
            driverLocation.latitude,
            driverLocation.longitude,
            dropOffCoords.latitude,
            dropOffCoords.longitude,
          );

          if (directions) {
            setEta(DirectionsService.formatDuration(directions.duration));
          }
        } catch (error) {
          console.error("❌ Failed to calculate ETA:", error);
        }
      };

      calculateEta();
    }
  }, [driverLocation, dropOffLat, dropOffLng]);

  // ============= END TRIP HANDLER =============
  const handleEndTrip = async () => {
    if (!rideId) return;

    setIsLoading(true);
    try {
      const response = await RideService.endTrip(rideId);

      if (response.success) {
        console.log("✅ Trip ended successfully");

        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        toast.show({
          type: "success",
          title: "Trip ended",
          message: "Please rate your experience.",
        });

        // Navigate to review screen
        router.replace({
          pathname: "/(passenger)/review",
          params: { rideId, driverName },
        });
      }
    } catch (error: any) {
      console.error("❌ Failed to end trip:", error);
      toast.show({
        type: "error",
        title: "End trip failed",
        message: error.response?.data?.message || "Failed to end trip.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const mapRegion = driverLocation
    ? {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: pickupCoords.latitude,
        longitude: pickupCoords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <ThemedView style={styles.container}>
      {/* Map with Driver Location */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          mapType="standard"
          region={mapRegion}
          provider="google"
          showsUserLocation={false}
        >
          {/* Driver Current Location Marker */}
          {driverLocation && (
            <Marker coordinate={driverLocation} title="Driver Location">
              <View style={styles.driverMarker}>
                <Ionicons name="car" size={24} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Pickup Location Marker */}
          <Marker
            coordinate={pickupCoords}
            title="Pickup Location"
            pinColor="#34D399"
          >
            <View style={styles.pickupMarker}>
              <Ionicons name="location" size={20} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Drop-off Location Marker */}
          <Marker
            coordinate={dropOffCoords}
            title="Drop-off Location"
            pinColor="#EF4444"
          >
            <View style={styles.dropOffMarker}>
              <Ionicons name="flag" size={20} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Trip Route Polyline */}
          {tripRoute.length > 0 && (
            <Polyline
              coordinates={tripRoute}
              strokeColor="#6C006C"
              strokeWidth={5}
              lineDashPattern={[0]}
            />
          )}
        </MapView>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <ThemedView px={24} py={30} bg="transparent">
          <View style={styles.dragIndicator} />

          <ThemedText
            size="xl"
            weight="bold"
            color="#6C006C"
            style={styles.header}
          >
            Trip in Progress
          </ThemedText>

          {/* Driver Info */}
          <ThemedView style={styles.infoCard} p={20}>
            <ThemedView
              flexDirection="row"
              align="center"
              mb={16}
              bg="transparent"
            >
              <View style={styles.avatar} />
              <ThemedView ml={12} bg="transparent">
                <ThemedText weight="bold" size="lg">
                  {driverName || "Driver"}
                </ThemedText>
                <ThemedText size="sm" color="#687076">
                  Taking you to destination
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Trip Stats */}
            <ThemedView
              flexDirection="row"
              justify="space-between"
              bg="transparent"
              style={styles.statsRow}
            >
              <ThemedView bg="transparent" align="center">
                <ThemedText size="sm" color="#687076">
                  Distance
                </ThemedText>
                <ThemedText weight="bold">
                  {distance > 0
                    ? `${distance.toFixed(1)} km`
                    : "Calculating..."}
                </ThemedText>
              </ThemedView>
              <ThemedView bg="transparent" align="center">
                <ThemedText size="sm" color="#687076">
                  ETA
                </ThemedText>
                <ThemedText weight="bold">{eta || "Calculating..."}</ThemedText>
              </ThemedView>
              <ThemedView bg="transparent" align="center">
                <ThemedText size="sm" color="#687076">
                  Status
                </ThemedText>
                <ThemedText weight="bold" color="#34D399">
                  {tripStatus}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* End Trip Button */}
          <ThemedButton
            text={isLoading ? "Ending Trip..." : "End Trip"}
            onPress={handleEndTrip}
            style={styles.endButton}
            disabled={isLoading}
          />

          {isLoading && (
            <ThemedView py={10} align="center" bg="transparent">
              <InlineLoader color="#6C006C" size={6} />
            </ThemedView>
          )}
        </ThemedView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    paddingBottom: 40,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E5E7EB",
  },
  statsRow: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  endButton: {
    borderRadius: 20,
    height: 60,
    backgroundColor: "#EF4444",
  },
  driverMarker: {
    backgroundColor: "#6C006C",
    padding: 8,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pickupMarker: {
    backgroundColor: "#34D399",
    padding: 6,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropOffMarker: {
    backgroundColor: "#EF4444",
    padding: 6,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
