import { InlineLoader } from "@/components/common/loaders";
import { useToast } from "@/components/common/toast-provider";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { DirectionsService } from "@/services/directions.service";
import { RideService } from "@/services/ride.service";
import { Trip } from "@/services/types";
import { calculateDistance } from "@/utils/distance";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export default function DriverMeetPassengerScreen() {
  const router = useRouter();
  const toast = useToast();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>(
    [],
  );
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // ============= LOCATION TRACKING =============
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          toast.show({
            type: "error",
            title: "Permission Denied",
            message: "Location permission is required to meet passenger.",
          });
          return;
        }

        // Get initial location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setDriverLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        setIsLoadingLocation(false);

        // Update location every 4 seconds
        locationIntervalRef.current = setInterval(async () => {
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });

            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };

            setDriverLocation(newLocation);

            // Send location to backend
            if (tripId) {
              await RideService.updateDriverLocation({
                rideId: tripId,
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
              });
            }

            // Calculate distance to passenger
            if (trip?.pickupLatitude && trip?.pickupLongitude) {
              const dist = calculateDistance(
                newLocation.latitude,
                newLocation.longitude,
                trip.pickupLatitude,
                trip.pickupLongitude,
              );
              setDistance(dist);
            }
          } catch (error) {
            console.error("Error updating location:", error);
          }
        }, 4000);
      } catch (error) {
        console.error("Error requesting location permission:", error);
        setIsLoadingLocation(false);
      }
    })();

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [trip]);

  // ============= POLL TRIP STATUS =============
  useEffect(() => {
    if (!tripId) return;

    const pollTrip = async () => {
      try {
        const response = await RideService.getLiveRideState(tripId);
        if (response.success && response.data) {
          const liveState = response.data;

          // Update driver location if available
          if (liveState.driverLocation) {
            setDriverLocation(liveState.driverLocation);
          }

          // Update confirmation status
          if (liveState.driverMetConfirmed) {
            setIsConfirmed(true);
          }

          // If both confirmed or trip already in progress, navigate
          if (
            liveState.status === "IN_PROGRESS" ||
            liveState.status === "MET_CONFIRMED" ||
            (liveState.driverMetConfirmed && liveState.passengerMetConfirmed)
          ) {
            router.replace("/(driver)/home");
          }

          // If trip cancelled, navigate back
          if (liveState.status === "CANCELLED") {
            toast.show({
              type: "warning",
              title: "Trip Cancelled",
              message: "The passenger cancelled the trip.",
            });
            router.replace("/(driver)/home");
          }
        }
      } catch (error) {
        console.error("Error polling live state:", error);
      }
    };

    pollingIntervalRef.current = setInterval(pollTrip, 4000);
    pollTrip(); // Initial poll

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [tripId]);

  // ============= FETCH ROUTE =============
  useEffect(() => {
    if (
      !driverLocation ||
      trip?.pickupLatitude === undefined ||
      trip?.pickupLongitude === undefined
    )
      return;

    (async () => {
      try {
        const directions = await DirectionsService.getDirections(
          driverLocation.latitude,
          driverLocation.longitude,
          trip.pickupLatitude!,
          trip.pickupLongitude!,
        );

        if (directions) {
          setRouteCoordinates(directions.coordinates);
          setDistance(directions.distance);
          setEta(DirectionsService.formatDuration(directions.duration));
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    })();
  }, [driverLocation, trip?.pickupLatitude, trip?.pickupLongitude]);

  // ============= CONFIRM MEETING =============
  const handleConfirmMeet = async () => {
    if (!tripId || isConfirmed) return;

    setIsConfirming(true);
    try {
      const response = await RideService.confirmDriverMeet(tripId);

      if (response.success) {
        setIsConfirmed(true);
        toast.show({
          type: "success",
          title: "Confirmed",
          message: "You confirmed meeting the passenger.",
        });

        // Check if passenger also confirmed (polling will handle auto-navigation)
      } else {
        toast.show({
          type: "error",
          title: "Confirmation Failed",
          message: response.message || "Could not confirm meeting.",
        });
      }
    } catch (error: any) {
      console.error("Error confirming meet:", error);
      toast.show({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to confirm meeting.",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const mapRegion = driverLocation
    ? {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 6.5244,
        longitude: 3.3792,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  if (!trip) {
    return (
      <ThemedView style={styles.container}>
        <InlineLoader color="#6C006C" size={8} />
        <ThemedText style={{ marginTop: 16 }}>
          Loading trip details...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Map showing driver and passenger locations */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          mapType="standard"
          initialRegion={mapRegion}
          provider="google"
        >
          {/* Driver Location */}
          {driverLocation && (
            <Marker
              coordinate={driverLocation}
              title="Your Location"
              pinColor="#6C006C"
            >
              <View style={styles.driverMarker}>
                <Ionicons name="car" size={24} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Passenger Pickup Location */}
          {trip?.pickupLatitude && trip?.pickupLongitude && (
            <Marker
              coordinate={{
                latitude: trip.pickupLatitude,
                longitude: trip.pickupLongitude,
              }}
              title="Passenger Pickup"
              pinColor="#FF9500"
            >
              <View style={styles.passengerMarker}>
                <Ionicons name="location" size={24} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Route Polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#6C006C"
              strokeWidth={4}
            />
          )}
        </MapView>
      </View>

      {/* Bottom Sheet with Passenger Info & Confirmation */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragIndicator} />

        <ThemedView p={20} bg="transparent">
          {/* Passenger Details */}
          <ThemedText size="lg" weight="bold" color="#6C006C">
            Meet Passenger
          </ThemedText>

          <ThemedView
            style={styles.passengerCard}
            p={16}
            mt={16}
            flexDirection="row"
            align="center"
          >
            <View style={styles.avatarPlaceholder} />
            <ThemedView ml={16} bg="transparent">
              <ThemedText weight="bold">
                {trip?.user?.fullName || "Passenger"}
              </ThemedText>
              <ThemedText size="sm" color="#687076">
                {trip?.user?.phoneNumber || "No phone"}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Distance & ETA */}
          {distance !== null && (
            <ThemedView
              flexDirection="row"
              justify="space-around"
              style={styles.infoBox}
              p={16}
              mt={16}
            >
              <ThemedView align="center" bg="transparent">
                <ThemedText size="sm" color="#687076">
                  Distance
                </ThemedText>
                <ThemedText weight="bold">{distance.toFixed(1)} km</ThemedText>
              </ThemedView>
              {eta && (
                <ThemedView align="center" bg="transparent">
                  <ThemedText size="sm" color="#687076">
                    ETA
                  </ThemedText>
                  <ThemedText weight="bold">{eta}</ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          )}

          {/* Confirmation Button */}
          <ThemedButton
            text={isConfirmed ? "✓ Confirmed" : "I Have Met Passenger"}
            onPress={handleConfirmMeet}
            disabled={isConfirmed || isConfirming}
            style={styles.confirmButton}
          />

          {isConfirmed && (
            <ThemedText
              size="sm"
              color="#34C759"
              align="center"
              style={{ marginTop: 12 }}
            >
              Waiting for passenger to confirm...
            </ThemedText>
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
  driverMarker: {
    backgroundColor: "#6C006C",
    padding: 8,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  passengerMarker: {
    backgroundColor: "#FF9500",
    padding: 8,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#FFFFFF",
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
    maxHeight: "50%",
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  passengerCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E5E7EB",
  },
  infoBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  confirmButton: {
    marginTop: 20,
    borderRadius: 20,
    height: 60,
  },
});
