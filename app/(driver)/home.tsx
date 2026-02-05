import { InlineLoader } from "@/components/common/loaders";
import { useToast } from "@/components/common/toast-provider";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RideService } from "@/services/ride.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { Href, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

/**
 * DriverHomeScreen - Driver waiting for and accepting ride requests
 *
 * IMPLEMENTATION: REST-based Polling (NO WebSockets)
 * - Polls every 5 seconds for new ride requests
 * - Polls every 5 seconds for trip status updates
 * - Sends location updates every 3 seconds via REST during active trip
 *
 * API Endpoints Used:
 * - GET /api/v1/rides/available - Fetch available ride requests
 * - GET /api/v1/trips/{tripId} - Fetch current trip status
 * - POST /api/v1/rides/propose-price - Send price offer to passenger
 * - POST /api/v1/rides/update-location - Update driver location
 */

type DriverState = "online" | "incoming" | "modify_price" | "accepted";

export default function DriverHomeScreen() {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<DriverState>("online");
  const [newFare, setNewFare] = useState("5000");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<any>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    // ============= REST-BASED POLLING FOR RIDE REQUESTS =============
    // Continuously check for new ride requests every 5 seconds
    // This replaces WebSocket real-time updates with REST API calls

    if (state === "online") {
      console.log("🔄 Starting polling for ride requests");

      const pollForRides = async () => {
        try {
          // Fetch available ride requests from backend
          const response = await RideService.getAvailableRides();
          if (response.success && response.data && response.data.length > 0) {
            const newTrip = response.data[0]; // Get first available ride

            // Only show if it's a new trip (different from current)
            if (!currentTrip || currentTrip.id !== newTrip.id) {
              console.log("📍 New Ride Request:", newTrip);
              setCurrentTrip(newTrip);
              setState("incoming");
              toast.show({
                type: "info",
                title: "New Ride!",
                message: `From ${newTrip.fromLocation} to ${newTrip.toLocation}`,
              });
            }
          }
        } catch (error) {
          console.error("❌ Polling error:", error);
          // Don't show error toast for every failed poll
        }
      };

      // Start polling every 5 seconds
      pollingIntervalRef.current = setInterval(pollForRides, 5000);

      // Initial poll immediately
      pollForRides();

      // Cleanup: Stop polling when state changes
      return () => {
        if (pollingIntervalRef.current) {
          console.log("🛑 Stopping ride request polling");
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }

    // ============= POLL FOR TRIP STATUS UPDATES =============
    if ((state === "incoming" || state === "accepted") && currentTrip?.id) {
      console.log("🔄 Starting trip status polling");

      const pollTripStatus = async () => {
        try {
          const response = await RideService.getTripStatus(currentTrip.id);
          if (response.success && response.data) {
            const trip = response.data;
            console.log(`📊 Trip Status: ${trip.status}`);

            if (trip.status === "CANCELLED") {
              console.log("❌ Trip cancelled by passenger");
              toast.show({
                type: "warning",
                title: "Trip cancelled",
                message: "The passenger has cancelled the ride.",
              });
              setState("online");
              setCurrentTrip(null);

              // Stop polling
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
            } else if (trip.status === "COMPLETED") {
              console.log("✅ Trip completed");
              toast.show({
                type: "success",
                title: "Trip completed",
                message: "Passenger dropped off successfully.",
              });
              setState("online");
              setCurrentTrip(null);

              // Stop polling
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
            } else if (
              trip.status === "ACCEPTED" &&
              trip.driverId !== currentTrip.driverId
            ) {
              // Trip was taken by another driver
              console.log(`⛔ Trip taken by another driver`);
              toast.show({
                type: "info",
                title: "Trip taken",
                message: "Another driver accepted this trip.",
              });
              setState("online");
              setCurrentTrip(null);

              // Stop polling
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
            }
          }
        } catch (error) {
          console.error("❌ Trip status polling error:", error);
        }
      };

      // Poll trip status every 5 seconds
      pollingIntervalRef.current = setInterval(pollTripStatus, 5000);
      pollTripStatus();

      return () => {
        if (pollingIntervalRef.current) {
          console.log("🛑 Stopping trip status polling");
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [state, currentTrip?.id]);

  useEffect(() => {
    // ============= LOCATION TRACKING VIA REST FOR ACTIVE TRIP =============
    // Driver sends location updates every 3 seconds during accepted trip via REST API
    if (state === "accepted" && currentTrip?.id) {
      const updateLocation = async () => {
        try {
          const freshLocation = await Location.getCurrentPositionAsync({});

          // Send location update via REST API
          await RideService.updateDriverLocation({
            tripId: currentTrip.id,
            latitude: freshLocation.coords.latitude,
            longitude: freshLocation.coords.longitude,
          });

          console.log(
            `📍 Location sent: ${freshLocation.coords.latitude}, ${freshLocation.coords.longitude}`,
          );
        } catch (error) {
          console.error("❌ Failed to update location via REST:", error);
        }
      };

      // Start location updates every 3 seconds
      locationIntervalRef.current = setInterval(updateLocation, 3000);

      // Send location immediately
      updateLocation();

      return () => {
        if (locationIntervalRef.current) {
          console.log("🛑 Stopping location updates");
          clearInterval(locationIntervalRef.current);
          locationIntervalRef.current = null;
        }
      };
    }
  }, [state, currentTrip?.id]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  const handleAccept = async () => {
    if (!currentTrip) return;
    setIsLoading(true);
    try {
      await RideService.acceptOffer(currentTrip.id);
      setState("accepted");
    } catch (error: any) {
      toast.show({
        type: "error",
        title: "Accept failed",
        message: error.response?.data?.message || "Failed to accept offer.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProposePrice = async (offeredPrice: number) => {
    if (!currentTrip) return;
    console.log(
      `💰 Proposing price ₦${offeredPrice} for trip ${currentTrip.id}`,
    );

    setIsLoading(true);
    try {
      // ============= SEND PRICE OFFER VIA REST API =============
      // Server will send this offer to the passenger
      const response = await RideService.proposePrice(
        currentTrip.id,
        offeredPrice,
      );

      if (response.success) {
        console.log("✅ Price offer sent successfully");
        toast.show({
          type: "success",
          title: "Offer sent",
          message: `Offered ₦${offeredPrice.toLocaleString()} to rider`,
        });
        setState("online");
        setCurrentTrip(null);
      } else {
        console.error("❌ Failed to send price offer");
        toast.show({
          type: "error",
          title: "Offer failed",
          message: response.message || "Could not send offer. Try again.",
        });
      }
    } catch (error: any) {
      console.error("❌ Price offer error:", error);
      toast.show({
        type: "error",
        title: "Offer failed",
        message: error.response?.data?.message || "Could not send offer.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrip = () => {
    // Logic to start trip
    toast.show({
      type: "success",
      title: "Trip started",
      message: "You can now head to the pickup location.",
    });
  };

  const initialRegion = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 6.5244,
        longitude: 3.3792,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <ThemedView style={styles.container}>
      {/* Real-Time Map */}
      <View style={styles.mapContainer}>
        {/* Floating Profile Button */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push("/(driver)/profile" as Href)}
        >
          <Ionicons name="person" size={24} color="#6C006C" />
        </TouchableOpacity>

        {!location && !errorMsg ? (
          <View style={styles.loadingContainer}>
            <InlineLoader color="#6C006C" size={8} />
            <ThemedText style={{ marginTop: 10 }}>
              Setting up driver radar...
            </ThemedText>
          </View>
        ) : (
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            showsUserLocation={true}
            followsUserLocation={true}
          >
            {location && (
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="My Position"
                pinColor="#6C006C"
              >
                <View style={styles.driverMarker}>
                  <Ionicons name="car" size={24} color="#FFFFFF" />
                </View>
              </Marker>
            )}
          </MapView>
        )}
      </View>

      {/* Online Status Banner */}
      {state === "online" && (
        <ThemedView
          style={[styles.statusBanner, { backgroundColor: "#6C006C" }]}
          flexDirection="row"
          align="center"
          px={20}
          py={16}
        >
          <View style={styles.onlineIndicator} />
          <ThemedView ml={12} bg="transparent">
            <ThemedText weight="bold" style={{ color: "#FFFFFF" }}>
              You are online
            </ThemedText>
            <ThemedText size="sm" style={{ color: "#E1E1E1" }}>
              Waiting for ride requests…
            </ThemedText>
          </ThemedView>
          <TouchableOpacity
            style={styles.simulateBtn}
            onPress={() => setState("incoming")}
          >
            <ThemedText size="xs" color="#FFFFFF" weight="bold">
              Simulate
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      {/* Incoming Ride Request Overlay */}
      {state === "incoming" && (
        <View style={styles.overlay}>
          <ThemedView style={styles.requestCard} p={24}>
            <ThemedText
              size="lg"
              weight="bold"
              color="#6C006C"
              style={styles.cardHeader}
            >
              New ride request
            </ThemedText>

            <ThemedView style={styles.locationContainer} mb={20}>
              <ThemedView
                flexDirection="row"
                align="center"
                mb={12}
                bg="transparent"
              >
                <Ionicons name="radio-button-on" size={16} color="#6C006C" />
                <ThemedText size="sm" ml={10}>
                  Pickup: {currentTrip?.fromLocation || "Calculating..."}
                </ThemedText>
              </ThemedView>
              <ThemedView flexDirection="row" align="center" bg="transparent">
                <Ionicons name="location" size={16} color="#FF3B30" />
                <ThemedText size="sm" ml={10}>
                  Drop-off: {currentTrip?.toLocation || "Calculating..."}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView
              flexDirection="row"
              justify="space-between"
              mb={24}
              bg="transparent"
            >
              <ThemedView bg="transparent">
                <ThemedText size="xs" color="#687076">
                  Distance
                </ThemedText>
                <ThemedText weight="bold">
                  {currentTrip?.distance || "0"} km
                </ThemedText>
              </ThemedView>
              <ThemedView bg="transparent">
                <ThemedText size="xs" color="#687076">
                  Fare
                </ThemedText>
                <ThemedText size="lg" weight="bold" color="#6C006C">
                  ₦{(currentTrip?.initialFare || 0).toLocaleString()}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView flexDirection="row" gap={12} bg="transparent">
              <ThemedButton
                text="Modify Price"
                variant="outline"
                onPress={() => setState("modify_price")}
                style={{ flex: 1 }}
              />
              <ThemedButton
                text="Accept Ride"
                variant="solid"
                onPress={handleAccept}
                style={{ flex: 1.5 }}
              />
            </ThemedView>
          </ThemedView>
        </View>
      )}

      {/* Modify Price Modal */}
      <Modal
        visible={state === "modify_price"}
        transparent
        animationType="slide"
      >
        <ThemedView style={styles.modalOverlay} justify="flex-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%" }}
          >
            <ThemedView style={styles.modalContent} p={24}>
              <View style={styles.dragIndicator} />
              <ThemedText size="xl" weight="bold" style={styles.modalTitle}>
                Adjust fare
              </ThemedText>
              <ThemedText color="#687076" mb={24}>
                Set a price you’re comfortable with.
              </ThemedText>

              <ThemedView style={styles.priceInputContainer} mb={32}>
                <ThemedText size="sm" weight="bold" mb={8}>
                  New Fare Amount (₦)
                </ThemedText>
                <TextInput
                  style={styles.priceInput}
                  value={newFare}
                  onChangeText={setNewFare}
                  keyboardType="number-pad"
                  autoFocus
                />
              </ThemedView>

              <ThemedButton
                text="Send Offer"
                variant="solid"
                onPress={() => setState("incoming")}
              />
              <TouchableOpacity
                onPress={() => setState("incoming")}
                style={styles.cancelLink}
              >
                <ThemedText align="center" color="#687076">
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </KeyboardAvoidingView>
        </ThemedView>
      </Modal>

      {/* Ride Accepted Banner */}
      {state === "accepted" && (
        <ThemedView style={styles.acceptedBanner} p={24}>
          <ThemedText size="lg" weight="bold" color="#6C006C">
            Ride confirmed
          </ThemedText>
          <ThemedText size="sm" color="#687076" mb={24}>
            Navigate to pickup location.
          </ThemedText>

          <ThemedButton
            text="Start Trip"
            variant="solid"
            onPress={handleStartTrip}
            style={{ height: 56, borderRadius: 16 }}
          />
        </ThemedView>
      )}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6C006C",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  profileButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusBanner: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#34C759",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  simulateBtn: {
    marginLeft: "auto",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    padding: 20,
  },
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  cardHeader: {
    marginBottom: 20,
  },
  locationContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
  modalTitle: {
    marginBottom: 8,
  },
  priceInputContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    padding: 20,
  },
  priceInput: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#11181C",
    fontFamily: "PlusJakartaSans-Medium",
  },
  cancelLink: {
    marginTop: 20,
  },
  acceptedBanner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
});
