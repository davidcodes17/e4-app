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
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";

/**
 * RideRequestScreen - Passenger Screen for Searching Drivers
 *
 * IMPLEMENTATION: REST-based Polling (NO WebSockets)
 * - Polls every 5 seconds for price offers from drivers
 * - Polls every 5 seconds for trip status changes (REQUESTED → ACCEPTED → ARRIVED → ONGOING → COMPLETED)
 * - Stops polling when driver accepts or trip completes
 *
 * API Endpoints Used:
 * - GET /api/v1/trips/{tripId}/offers - Fetch driver price offers
 * - GET /api/v1/trips/{tripId} - Fetch current trip status
 */

type ScreenState = "request" | "searching" | "found";

interface RideDetails {
  distance: number;
  duration: string;
  fare: number;
}

interface DriverInfo {
  name: string;
  vehicle: string;
  plate: string;
  rating: string;
}

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export default function RideRequestScreen() {
  const router = useRouter();
  const toast = useToast();
  const { pickup, pickupLat, pickupLong, destination } = useLocalSearchParams<{
    pickup: string;
    pickupLat: string;
    pickupLong: string;
    destination: string;
  }>();

  const [state, setState] = useState<ScreenState>("request");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingEstimates, setIsFetchingEstimates] = useState(true);
  const [rideDetails, setRideDetails] = useState<RideDetails | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [priceOffers, setPriceOffers] = useState<any[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>(
    [],
  );
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Coordinates logic
  const pickupCoords = pickupLat
    ? {
        latitude: parseFloat(pickupLat),
        longitude: parseFloat(pickupLong),
      }
    : { latitude: 6.4311, longitude: 3.4697 }; // Fallback

  const destinationCoords = { latitude: 6.4253, longitude: 3.4041 }; // Mock destination for demo

  // Map region centered on pickup location with good zoom level
  const mapRegion = {
    latitude: pickupCoords.latitude,
    longitude: pickupCoords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };
  useEffect(() => {
    const fetchDirections = async () => {
      try {
        setIsLoadingRoute(true);
        const directions = await DirectionsService.getDirections(
          pickupCoords.latitude,
          pickupCoords.longitude,
          destinationCoords.latitude,
          destinationCoords.longitude,
        );

        if (directions) {
          setRouteCoordinates(directions.coordinates);
          // Update ride details with real directions data
          setRideDetails({
            distance: directions.distance,
            duration: DirectionsService.formatDuration(directions.duration),
            fare: DirectionsService.calculateFare(
              directions.distance,
              directions.duration,
            ),
          });
        } else {
          // Fallback to simple polyline if directions fail
          setRouteCoordinates([pickupCoords, destinationCoords]);
        }
      } catch (error) {
        console.error("Error fetching directions:", error);
        toast.show({
          type: "error",
          title: "Route unavailable",
          message: "Could not fetch directions. Using estimate.",
        });
        setRouteCoordinates([pickupCoords, destinationCoords]);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchDirections();
  }, []);

  useEffect(() => {
    const fetchEstimates = async () => {
      try {
        const response = await RideService.getEstimate({
          pickupLatitude: pickupCoords.latitude,
          pickupLongitude: pickupCoords.longitude,
          dropOffLatitude: destinationCoords.latitude,
          dropOffLongitude: destinationCoords.longitude,
        });

        // Handle potential double nesting: { data: { data: { ... } } }
        const apiData = response?.data as any;
        const estimateData = apiData?.data || apiData;

        if (
          estimateData &&
          estimateData.distance !== undefined &&
          !rideDetails
        ) {
          setRideDetails({
            distance: estimateData.distance,
            duration: estimateData.duration.toString(),
            fare: estimateData.estimate,
          });
        }
      } catch (error) {
        console.error("Failed to fetch estimates:", error);
        toast.show({
          type: "error",
          title: "Estimates unavailable",
          message: "Could not get ride estimates. Please try again.",
        });
      } finally {
        setIsFetchingEstimates(false);
      }
    };

    fetchEstimates();
  }, []);

  useEffect(() => {
    // ============= REST-BASED POLLING MECHANISM =============
    // Continuously check for driver offers and trip status updates every 5 seconds
    // This replaces WebSocket real-time updates with REST API calls

    if (state === "searching" && currentTripId) {
      console.log("🔄 Starting polling for trip:", currentTripId);

      const pollForUpdates = async () => {
        try {
          // 1. Fetch price offers from drivers
          const offersResponse = await RideService.getTripOffers(currentTripId);
          if (offersResponse.success && offersResponse.data) {
            const offers = offersResponse.data;

            // Update offers list if new offers arrived
            if (offers.length > priceOffers.length) {
              console.log(`💰 New price offers: ${offers.length}`);
              setPriceOffers(
                offers.map((offer: any) => ({
                  ...offer,
                  driverName: `${offer.driver?.firstName} ${offer.driver?.lastName}`,
                  price: offer.offeredPrice,
                })),
              );
            }
          }

          // 2. Fetch trip status to check if driver accepted
          const statusResponse = await RideService.getTripStatus(currentTripId);
          if (statusResponse.success && statusResponse.data) {
            const trip = statusResponse.data;
            console.log(`📊 Trip Status: ${trip.status}`);

            // Handle different trip statuses
            if (trip.status === "ACCEPTED" && state === "searching") {
              console.log("✅ Driver accepted the trip");
              setDriverInfo({
                name: trip.driver?.fullName || "Driver",
                vehicle: trip.driver?.carName,
                plate: trip.driver?.licensePlate,
                rating: trip.driver?.rating?.toString() || "N/A",
              });
              setState("found");
              toast.show({
                type: "success",
                title: "Driver accepted!",
                message: `${trip.driver?.fullName || "Your driver"} accepted your ride request.`,
              });

              // Stop polling when driver is found
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
            } else if (trip.status === "ARRIVED") {
              console.log("📍 Driver arrived at pickup location");
              toast.show({
                type: "info",
                title: "Driver arrived",
                message: "Your driver is at the pickup location.",
              });
            } else if (trip.status === "ONGOING") {
              console.log("🚗 Trip is now in progress");
              toast.show({
                type: "info",
                title: "Trip started",
                message: "Your trip is now in progress.",
              });
            } else if (trip.status === "COMPLETED") {
              console.log("✅ Trip completed");
              toast.show({
                type: "success",
                title: "Trip completed",
                message: "Thank you for riding with E4!",
              });

              // Stop polling
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
            } else if (trip.status === "CANCELLED") {
              console.log("❌ Trip cancelled");
              toast.show({
                type: "warning",
                title: "Trip cancelled",
                message: "Your trip has been cancelled.",
              });
              setState("request");
              setPriceOffers([]);

              // Stop polling
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
            }
          }
        } catch (error) {
          console.error("❌ Polling error:", error);
          // Don't show error toast for every failed poll, just log it
        }
      };

      // Start polling every 5 seconds
      pollingIntervalRef.current = setInterval(pollForUpdates, 5000);

      // Initial poll immediately
      pollForUpdates();

      // Cleanup: Stop polling when component unmounts or state changes
      return () => {
        if (pollingIntervalRef.current) {
          console.log("🛑 Stopping polling");
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [state, currentTripId]);

  const handleAcceptOffer = async (offer: any) => {
    setIsLoading(true);
    try {
      await RideService.acceptOffer(offer.id);
      // Redirection logic usually handled by ride-status subscription
    } catch (error: any) {
      toast.show({
        type: "error",
        title: "Offer failed",
        message: "Failed to accept offer. It may have expired.",
      });
      setIsLoading(false);
    }
  };

  const handleRequestRide = async () => {
    if (!rideDetails) return;
    setIsLoading(true);
    setState("searching");
    try {
      const response = await RideService.requestRide({
        fromLocation: pickup || "Current Location",
        toLocation: destination || "Victoria Island, Lagos",
        pickupLatitude: pickupCoords.latitude,
        pickupLongitude: pickupCoords.longitude,
        dropOffLatitude: destinationCoords.latitude,
        dropOffLongitude: destinationCoords.longitude,
        distance: rideDetails.distance,
        duration: rideDetails.duration,
        initialFare: rideDetails.fare,
      });

      // Extract trip ID from response to use for polling
      if (response.success && response.data) {
        const tripId = response.data.id;
        console.log("🚗 Ride requested successfully. Trip ID:", tripId);
        setCurrentTripId(tripId);
        setIsLoading(false);
      }
    } catch (error: any) {
      toast.show({
        type: "error",
        title: "Request failed",
        message: error.response?.data?.message || "Failed to request ride.",
      });
      setState("request");
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Real-Time Map with Route */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
        >
          <Marker coordinate={pickupCoords} title="Pickup" pinColor="#6C006C" />
          <Marker
            coordinate={destinationCoords}
            title="Destination"
            pinColor="#FF3B30"
          />
          {driverLocation && (
            <Marker coordinate={driverLocation} title="Driver">
              <View style={styles.driverMarker}>
                <Ionicons name="car" size={20} color="#FFFFFF" />
              </View>
            </Marker>
          )}
          {/* Route polyline with real directions */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#6C006C"
              strokeWidth={5}
              lineDashPattern={[0]}
            />
          )}
          {/* Fallback simple line if no route */}
          {routeCoordinates.length === 0 && (
            <Polyline
              coordinates={[pickupCoords, destinationCoords]}
              strokeColor="#6C006C"
              strokeWidth={4}
            />
          )}
        </MapView>
      </View>

      <View style={styles.bottomSheet}>
        {state === "request" && (
          <ThemedView px={24} py={30} bg="transparent">
            <View style={styles.dragIndicator} />
            {isFetchingEstimates ? (
              <ThemedView py={20} align="center" bg="transparent">
                <InlineLoader color="#6C006C" size={7} />
                <ThemedText size="sm" style={{ marginTop: 8 }}>
                  Calculating fare...
                </ThemedText>
              </ThemedView>
            ) : rideDetails ? (
              <ThemedView style={styles.rideInfoCard} p={20}>
                <ThemedView
                  flexDirection="row"
                  justify="space-between"
                  align="center"
                  style={styles.infoRow}
                >
                  <ThemedView bg="transparent">
                    <ThemedText size="sm" color="#687076">
                      Distance
                    </ThemedText>
                    <ThemedText weight="bold">
                      {rideDetails.distance} km
                    </ThemedText>
                  </ThemedView>
                  <ThemedView bg="transparent">
                    <ThemedText size="sm" color="#687076">
                      Est. Time
                    </ThemedText>
                    <ThemedText weight="bold">
                      {rideDetails?.duration + " mins"}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView bg="transparent">
                    <ThemedText size="sm" color="#687076">
                      Fare
                    </ThemedText>
                    <ThemedText size="lg" weight="bold" color="#6C006C">
                      ₦{rideDetails.fare.toLocaleString()}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            ) : (
              <ThemedView py={20} align="center" bg="transparent">
                <ThemedText color="#FF3B30">Estimates unavailable</ThemedText>
              </ThemedView>
            )}

            <ThemedButton
              text="Request Ride"
              onPress={handleRequestRide}
              style={styles.mainButton}
              disabled={isFetchingEstimates || !rideDetails}
            />
            <ThemedText
              size="xs"
              color="#687076"
              align="center"
              style={styles.hint}
            >
              You will be notified when a driver accepts.
            </ThemedText>
          </ThemedView>
        )}

        {state === "searching" && (
          <ThemedView px={24} py={30} bg="transparent">
            <ThemedView align="center" py={10} bg="transparent">
              <View style={styles.loader}>
                <InlineLoader color="#6C006C" size={8} />
              </View>
              <ThemedText size="xl" weight="bold" style={styles.statusText}>
                {priceOffers.length > 0
                  ? "Review offers"
                  : "Searching for drivers…"}
              </ThemedText>
              <ThemedText color="#687076">
                {priceOffers.length > 0
                  ? `Drivers are bidding for your ride`
                  : "This may take a few seconds."}
              </ThemedText>
            </ThemedView>

            <ScrollView
              style={styles.offersList}
              showsVerticalScrollIndicator={false}
            >
              {priceOffers.map((offer, index) => (
                <ThemedView
                  key={offer.id || index}
                  style={styles.offerCard}
                  p={16}
                  flexDirection="row"
                  align="center"
                >
                  <View style={styles.miniAvatar} />
                  <ThemedView ml={12} bg="transparent">
                    <ThemedText weight="bold">{offer.driverName}</ThemedText>
                    <ThemedText size="xs" color="#687076">
                      {offer.vehicleModel}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView ml="auto" align="flex-end" bg="transparent">
                    <ThemedText size="lg" weight="bold" color="#6C006C">
                      ₦{offer.offeredPrice.toLocaleString()}
                    </ThemedText>
                    <TouchableOpacity onPress={() => handleAcceptOffer(offer)}>
                      <ThemedView
                        bg="#6C006C"
                        px={16}
                        py={8}
                        style={{ borderRadius: 10, marginTop: 4 }}
                      >
                        <ThemedText color="#FFFFFF" size="xs" weight="bold">
                          Accept
                        </ThemedText>
                      </ThemedView>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              ))}
            </ScrollView>

            <ThemedButton
              text="Cancel Search"
              variant="outline"
              onPress={() => router.back()}
              style={styles.cancelButton}
            />
          </ThemedView>
        )}

        {state === "found" && driverInfo && (
          <ThemedView px={24} py={30} bg="transparent">
            <ThemedText
              size="lg"
              weight="bold"
              color="#6C006C"
              style={styles.foundHeader}
            >
              Driver on the way
            </ThemedText>

            <ThemedView
              style={styles.driverCard}
              flexDirection="row"
              align="center"
              p={16}
            >
              <View style={styles.avatarPlaceholder} />
              <ThemedView style={styles.driverDetails} ml={16} bg="transparent">
                <ThemedText weight="bold">{driverInfo.name}</ThemedText>
                <ThemedText size="sm" color="#687076">
                  {driverInfo.vehicle} • {driverInfo.plate}
                </ThemedText>
              </ThemedView>
              <ThemedView
                style={styles.rating}
                ml="auto"
                align="center"
                bg="transparent"
              >
                <Ionicons name="star" size={16} color="#FFD700" />
                <ThemedText size="xs" weight="bold">
                  {driverInfo.rating}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.arrivalStatus} py={12} px={16}>
              <ThemedText weight="bold" color="#0284C7">
                Arriving soon (3 mins)
              </ThemedText>
            </ThemedView>

            <ThemedButton
              text="Cancel Ride"
              variant="outline"
              onPress={() => router.back()}
              style={styles.cancelButton}
            />
          </ThemedView>
        )}
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
  rideInfoCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  infoRow: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
  },
  mainButton: {
    borderRadius: 20,
    height: 60,
  },
  hint: {
    marginTop: 16,
  },
  loader: {
    marginBottom: 24,
  },
  statusText: {
    marginBottom: 8,
  },
  foundHeader: {
    marginBottom: 20,
  },
  driverCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F3F4F6",
  },
  driverDetails: {
    flex: 1,
  },
  rating: {
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 12,
  },
  arrivalStatus: {
    borderRadius: 16,
    marginBottom: 24,
    alignItems: "center",
    backgroundColor: "#F0F9FF",
  },
  cancelButton: {
    borderRadius: 20,
    height: 60,
    borderColor: "#FF3B30",
  },
  driverMarker: {
    backgroundColor: "#6C006C",
    padding: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  offersList: {
    maxHeight: 250,
    marginVertical: 10,
  },
  offerCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  miniAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
});
