import { InlineLoader } from "@/components/common/loaders";
import { useToast } from "@/components/common/toast-provider";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { DirectionsService } from "@/services/directions.service";
import { GooglePlacesService } from "@/services/google-places.service";
import { RideService } from "@/services/ride.service";
import { PriceOffer, TripPhase } from "@/services/types";
import { calculateDistance, hasDeviatedFromRoute } from "@/utils/distance";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

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

/* Demo cars removed — using real driver markers only */

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
  const [tripPhase, setTripPhase] = useState<TripPhase>(TripPhase.IDLE);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingEstimates, setIsFetchingEstimates] = useState(true);
  const [rideDetails, setRideDetails] = useState<RideDetails | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [priceOffers, setPriceOffers] = useState<PriceOffer[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const PICKUP_DETECTION_RADIUS = 50; // 50 meters
  const [destinationCoords, setDestinationCoords] = useState<{
    latitude: number;
    longitude: number;
  }>(() => ({
    latitude: 6.5244, // Lagos, Nigeria
    longitude: 3.3792,
  }));
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [driverRouteCoordinates, setDriverRouteCoordinates] = useState<
    RouteCoordinate[]
  >([]);
  const [driverEta, setDriverEta] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>(
    [],
  );
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const isCancelledRef = useRef(false);
  const [passengerLocation, setPassengerLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mainTripRoute, setMainTripRoute] = useState<RouteCoordinate[]>([]);
  const [mainTripEta, setMainTripEta] = useState<string | null>(null);

  // Coordinates logic
  const [pickupCoords, setPickupCoords] = useState<{
    latitude: number;
    longitude: number;
  }>(
    () =>
      pickupLat
        ? {
            latitude: parseFloat(pickupLat),
            longitude: parseFloat(pickupLong),
          }
        : { latitude: 6.5244, longitude: 3.3792 }, // Lagos, Nigeria
  );

  // If the map didn't provide coordinates but the user typed an address (pickup),
  // try to resolve it via Google Places (get predictions -> place details).
  React.useEffect(() => {
    const resolveTypedPickup = async () => {
      try {
        // Only attempt if we don't have explicit lat/long from params
        if ((!pickupLat || !pickupLong) && pickup) {
          const preds = await GooglePlacesService.getPlacePredictions(pickup);
          if (preds && preds.length > 0) {
            const details = await GooglePlacesService.getPlaceDetails(
              preds[0].place_id,
            );
            if (details) {
              setPickupCoords({
                latitude: details.latitude,
                longitude: details.longitude,
              });
            }
          }
        }
      } catch (error) {
        console.warn("Failed to geocode typed pickup:", error);
      }
    };

    resolveTypedPickup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map region centered on pickup location with good zoom level
  const mapRegion = {
    latitude: pickupCoords.latitude,
    longitude: pickupCoords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // No demo cars — show actual pickup & destination markers only

  // ============= PASSENGER LOCATION TRACKING =============
  // Send passenger location updates every 3 seconds after trip starts (ON_TRIP)
  useEffect(() => {
    if (state === "found" && tripPhase === TripPhase.ON_TRIP && currentTripId) {
      if (isCancelledRef.current) return;
      const updateLocation = async () => {
        try {
          // Request location permissions
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            console.warn("⚠️ Location permission not granted:", status);
            toast.show({
              type: "error",
              title: "Location Permission Required",
              message: "Please enable location access to continue.",
            });
            return;
          }

          // Get current location with high accuracy
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const coords = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          };

          setPassengerLocation(coords);

          // Send location update to backend
          await RideService.updatePassengerLocation({
            rideId: currentTripId,
            latitude: coords.latitude,
            longitude: coords.longitude,
          });

          console.log(
            `📍 Passenger location sent: ${coords.latitude}, ${coords.longitude}`,
          );
        } catch (error) {
          console.error("❌ Failed to update passenger location:", error);
        }
      };

      // Start location updates every 3 seconds
      locationIntervalRef.current = setInterval(updateLocation, 3000);

      // Send location immediately
      updateLocation();

      return () => {
        if (locationIntervalRef.current) {
          console.log("🛑 Stopping passenger location updates");
          clearInterval(locationIntervalRef.current);
          locationIntervalRef.current = null;
        }
      };
    }
  }, [state, currentTripId]);

  // ============= DRIVER TO PICKUP ROUTE CALCULATION =============
  // Calculate route from driver location to pickup when driver location updates
  useEffect(() => {
    const calculateDriverRoute = async () => {
      if (
        !isCancelledRef.current &&
        driverLocation &&
        (tripPhase === TripPhase.EN_ROUTE_TO_PICKUP ||
          tripPhase === TripPhase.DRIVER_ASSIGNED)
      ) {
        try {
          console.log("🗺️ Calculating route from driver to pickup...");
          const directions = await DirectionsService.getDirections(
            driverLocation.latitude,
            driverLocation.longitude,
            pickupCoords.latitude,
            pickupCoords.longitude,
          );

          if (directions) {
            setDriverRouteCoordinates(directions.coordinates);
            setDriverEta(DirectionsService.formatDuration(directions.duration));
            console.log(
              `✅ Driver route calculated. ETA: ${DirectionsService.formatDuration(directions.duration)}`,
            );
          }
        } catch (error) {
          console.error("❌ Failed to calculate driver route:", error);
        }
      }
    };

    calculateDriverRoute();
  }, [
    driverLocation,
    tripPhase,
    pickupCoords.latitude,
    pickupCoords.longitude,
  ]);

  // ============= PICKUP DETECTION & ROUTE TRANSITION =============
  // Detect when driver is within 50m of pickup and transition to main trip
  useEffect(() => {
    if (
      !isCancelledRef.current &&
      tripPhase === TripPhase.EN_ROUTE_TO_PICKUP &&
      driverLocation &&
      pickupCoords
    ) {
      const distance = calculateDistance(
        driverLocation.latitude,
        driverLocation.longitude,
        pickupCoords.latitude,
        pickupCoords.longitude,
      );

      setDistanceToPickup(distance);

      // Check if driver is within pickup detection radius
      if (distance <= PICKUP_DETECTION_RADIUS) {
        console.log("✅ PICKED UP! Driver is within 50m of pickup location");
        setTripPhase(TripPhase.PICKED_UP);

        toast.show({
          type: "success",
          title: "Picked up!",
          message: "Your driver has arrived. Trip started!",
        });

        // Transition to main trip route after a brief delay
        setTimeout(() => {
          setTripPhase(TripPhase.ON_TRIP);
          console.log("🚗 Transitioning to ON_TRIP phase");
        }, 1500);
      }
    }
  }, [driverLocation, tripPhase, pickupCoords, PICKUP_DETECTION_RADIUS]);

  // ============= MAIN TRIP ROUTE CALCULATION =============
  // Calculate route from driver's current location to destination during ON_TRIP
  useEffect(() => {
    if (
      !isCancelledRef.current &&
      tripPhase === TripPhase.ON_TRIP &&
      destinationCoords
    ) {
      const calculateMainTripRoute = async () => {
        try {
          console.log("🗺️ Calculating main trip route to destination...");
          const startLatitude =
            driverLocation?.latitude ?? pickupCoords.latitude;
          const startLongitude =
            driverLocation?.longitude ?? pickupCoords.longitude;
          const directions = await DirectionsService.getDirections(
            startLatitude,
            startLongitude,
            destinationCoords.latitude,
            destinationCoords.longitude,
          );

          if (directions) {
            setMainTripRoute(directions.coordinates);
            setMainTripEta(
              DirectionsService.formatDuration(directions.duration),
            );
            console.log(
              `✅ Main trip route calculated. ETA: ${DirectionsService.formatDuration(directions.duration)}`,
            );
          }
        } catch (error) {
          console.error("❌ Failed to calculate main trip route:", error);
        }
      };

      calculateMainTripRoute();
    }
  }, [
    tripPhase,
    destinationCoords,
    pickupCoords.latitude,
    pickupCoords.longitude,
    driverLocation,
  ]);

  // ============= ROUTE DEVIATION DETECTION =============
  // Recalculate route if driver deviates significantly during pre-pickup
  useEffect(() => {
    if (
      !isCancelledRef.current &&
      tripPhase === TripPhase.EN_ROUTE_TO_PICKUP &&
      driverLocation &&
      driverRouteCoordinates.length > 0
    ) {
      const deviated = hasDeviatedFromRoute(
        driverLocation.latitude,
        driverLocation.longitude,
        driverRouteCoordinates,
        100, // 100m deviation threshold
      );

      if (deviated) {
        console.log("⚠️ Driver deviated from route. Recalculating...");
        // The route calculation effect will be triggered again via dependencies
      }
    }
  }, [driverLocation, driverRouteCoordinates, tripPhase]);

  useEffect(() => {
    const fetchDirections = async () => {
      try {
        if (isCancelledRef.current) return;
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
  }, [
    pickupCoords.latitude,
    pickupCoords.longitude,
    destinationCoords.latitude,
    destinationCoords.longitude,
  ]);

  useEffect(() => {
    const fetchEstimates = async () => {
      try {
        if (isCancelledRef.current) return;
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
  }, [
    pickupCoords.latitude,
    pickupCoords.longitude,
    destinationCoords.latitude,
    destinationCoords.longitude,
  ]);

  useEffect(() => {
    // ============= REST-BASED POLLING MECHANISM =============
    // Continuously check for driver offers and trip status updates every 5 seconds
    // This replaces WebSocket real-time updates with REST API calls

    if ((state === "searching" || state === "found") && currentTripId) {
      if (isCancelledRef.current) return;
      console.log("🔄 Starting polling for trip:", currentTripId);

      const pollForUpdates = async () => {
        try {
          if (isCancelledRef.current) return;
          // 1. Fetch price offers from drivers
          const offersResponse = await RideService.getTripOffers(currentTripId);
          if (offersResponse.success && offersResponse.data) {
            const offers = offersResponse.data;

            // Update offers list if new offers arrived
            if (offers.length > priceOffers.length) {
              console.log(`💰 New price offers: ${offers.length}`);
              setPriceOffers(offers);
            }
          }

          // 2. Fetch trip status to check if driver accepted
          const statusResponse = await RideService.getTripStatus(currentTripId);
          if (statusResponse.success && statusResponse.data) {
            const trip =
              statusResponse.data?.data?.data ??
              statusResponse.data?.data ??
              statusResponse.data;
            console.log(`📊 Trip Status: ${trip.status}`);

            // Update driver location if available in trip response
            const driverLat =
              trip.driverLatitude ??
              trip.driver?.latitude ??
              trip.driver?.currentLatitude ??
              trip.driver?.location?.latitude;
            const driverLng =
              trip.driverLongitude ??
              trip.driver?.longitude ??
              trip.driver?.currentLongitude ??
              trip.driver?.location?.longitude;

            if (
              typeof driverLat === "number" &&
              typeof driverLng === "number"
            ) {
              setDriverLocation({ latitude: driverLat, longitude: driverLng });
            }

            if (
              typeof trip.dropOffLatitude === "number" &&
              typeof trip.dropOffLongitude === "number"
            ) {
              setDestinationCoords({
                latitude: trip.dropOffLatitude,
                longitude: trip.dropOffLongitude,
              });
            }

            // Handle different trip statuses
            if (trip.status === "ACCEPTED") {
              if (state === "searching") {
                console.log("✅ Driver accepted the trip");
                const driverName =
                  trip.driver?.fullName ||
                  (trip.driver?.firstName && trip.driver?.lastName
                    ? `${trip.driver.firstName} ${trip.driver.lastName}`
                    : "Driver");
                setDriverInfo({
                  name: driverName,
                  vehicle: trip.driver?.carName,
                  plate: trip.driver?.licensePlate || trip.driver?.plateNumber,
                  rating: trip.driver?.rating?.toString() || "N/A",
                });
                setState("found");
                setTripPhase(TripPhase.DRIVER_ASSIGNED);

                // Navigate to waiting screen after acceptance
                router.replace({
                  pathname: "/(passenger)/waiting-for-driver",
                  params: { tripId: trip.id || currentTripId },
                });

                // Schedule transition to EN_ROUTE_TO_PICKUP after 1 second
                setTimeout(() => {
                  setTripPhase(TripPhase.EN_ROUTE_TO_PICKUP);
                  console.log("🚗 Transitioned to EN_ROUTE_TO_PICKUP phase");
                }, 1000);

                toast.show({
                  type: "success",
                  title: "Driver accepted!",
                  message: `${driverName} accepted your ride request.`,
                });

                // KEEP POLLING to track driver location updates
                // Don't stop polling - we need to track driver location
                console.log("🔄 Continuing polling to track driver location");
              } else if (tripPhase !== TripPhase.EN_ROUTE_TO_PICKUP) {
                setTripPhase(TripPhase.EN_ROUTE_TO_PICKUP);
              }
            } else if (trip.status === "ARRIVED") {
              console.log("📍 Driver arrived at pickup location");
              setTripPhase(TripPhase.PICKED_UP);
              toast.show({
                type: "info",
                title: "Driver arrived",
                message: "Your driver is at the pickup location.",
              });
            } else if (trip.status === "ONGOING") {
              console.log("🚗 Trip is now in progress");
              setTripPhase(TripPhase.ON_TRIP);
              toast.show({
                type: "info",
                title: "Trip started",
                message: "Your trip is now in progress.",
              });
            } else if (trip.status === "COMPLETED") {
              console.log("✅ Trip completed");
              setTripPhase(TripPhase.COMPLETED);
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
      const response: any = await RideService.acceptOffer(offer.id);
      console.log("✅ Offer accepted:", response);

      // Clear the offers list since one has been accepted
      setPriceOffers([]);

      // Show confirmation toast
      toast.show({
        type: "success",
        title: "Offer Accepted",
        message: "Waiting for driver to confirm...",
      });

      // The polling will handle the status update from "REQUESTED" to "ACCEPTED"
      // So we just need to reset loading state
      setIsLoading(false);
    } catch (error: any) {
      console.error("❌ Failed to accept offer:", error);
      toast.show({
        type: "error",
        title: "Offer failed",
        message:
          error.response?.data?.message ||
          "Failed to accept offer. It may have expired.",
      });
      setIsLoading(false);
    }
  };

  const handleRequestRide = async () => {
    if (!rideDetails) return;
    isCancelledRef.current = false;
    setIsLoading(true);
    setState("searching");
    try {
      const response: any = await RideService.requestRide({
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
      console.log(response, "SHSH");
      if (response.success && response.data) {
        const tripId = response?.data?.data?.id;
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

  const handleCancelRide = async () => {
    isCancelledRef.current = true;
    if (!currentTripId) {
      router.back();
      return;
    }

    setIsLoading(true);
    try {
      await RideService.cancelRide(currentTripId);

      toast.show({
        type: "success",
        title: "Ride cancelled",
        message: "Your ride request has been cancelled.",
      });
    } catch (error: any) {
      console.error("❌ Failed to cancel ride:", error);
      toast.show({
        type: "error",
        title: "Cancel failed",
        message: error.response?.data?.message || "Failed to cancel ride.",
      });
    } finally {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }

      setState("request");
      setTripPhase(TripPhase.IDLE);
      setPriceOffers([]);
      setCurrentTripId(null);
      setDriverInfo(null);
      setDriverLocation(null);
      setIsLoading(false);
      router.back();
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Real-Time Map with Route & Demo Cars */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          mapType="standard"
          initialRegion={mapRegion}
          provider="google"
        >
          {/* User Pickup Marker Only */}
          <Marker
            coordinate={pickupCoords}
            title="Your Pickup Location"
            pinColor="#6C006C"
          >
            <View style={styles.userMarker}>
              <Ionicons name="location" size={24} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Destination Marker (Stop) */}
          <Marker
            coordinate={destinationCoords}
            title="Destination"
            pinColor="#FF9500"
          >
            <View style={styles.destinationMarker}>
              <Ionicons name="flag" size={18} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Actual Driver Marker (when searching/found) */}
          {driverLocation && state !== "request" && (
            <Marker coordinate={driverLocation} title="Your Driver">
              <View style={styles.activeDriverMarker}>
                <Ionicons name="car" size={24} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Driver-to-pickup route (pre-pickup navigation) */}
          {driverRouteCoordinates.length > 0 &&
            state !== "request" &&
            tripPhase !== TripPhase.ON_TRIP && (
              <Polyline
                coordinates={driverRouteCoordinates}
                strokeColor="#FF9500"
                strokeWidth={4}
                lineDashPattern={[6, 4]}
              />
            )}

          {/* Main trip route (pickup → destination) */}
          {tripPhase === TripPhase.ON_TRIP && mainTripRoute.length > 0 && (
            <Polyline
              coordinates={mainTripRoute}
              strokeColor="#6C006C"
              strokeWidth={5}
              lineDashPattern={[0]}
            />
          )}

          {/* Initial route preview (request/searching) */}
          {tripPhase !== TripPhase.ON_TRIP && routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#6C006C"
              strokeWidth={5}
              lineDashPattern={[0]}
            />
          )}
        </MapView>
        {tripPhase !== TripPhase.ON_TRIP && isLoadingRoute && (
          <View style={styles.routeLoaderOverlay}>
            <InlineLoader color="#6C006C" size={8} />
            <ThemedText size="xs" style={styles.routeLoaderText}>
              Loading route...
            </ThemedText>
          </View>
        )}
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
                    <ThemedText weight="bold">
                      {offer.driver.fullName}
                    </ThemedText>
                    <ThemedText size="xs" color="#687076">
                      ⭐ {offer.driver.averageRating?.toFixed(1) || "N/A"}
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
              onPress={handleCancelRide}
              disabled={isLoading}
              isLoading={isLoading}
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
                {driverEta
                  ? `Arriving in ${driverEta}`
                  : "Calculating arrival..."}
              </ThemedText>
            </ThemedView>

            <ThemedButton
              text="Cancel Ride"
              variant="outline"
              onPress={handleCancelRide}
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
  routeLoaderOverlay: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  routeLoaderText: {
    color: "#6C006C",
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
    // backgroundColor: "#F9FAFB",
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  infoRow: {
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
  userMarker: {
    backgroundColor: "#6C006C",
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
  carMarker: {
    backgroundColor: "#FFFFFF",
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#6C006C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  activeDriverMarker: {
    backgroundColor: "#FF9500",
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
  driverMarker: {
    backgroundColor: "#6C006C",
    padding: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  destinationMarker: {
    backgroundColor: "#FF9500",
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
