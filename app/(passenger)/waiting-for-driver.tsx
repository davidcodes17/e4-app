import { InlineLoader } from "@/components/common/loaders";
import { useToast } from "@/components/common/toast-provider";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RideService } from "@/services/ride.service";
import { Trip } from "@/services/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function PassengerWaitingForDriverScreen() {
  const router = useRouter();
  const toast = useToast();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [passengerLocation, setPassengerLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [driverEta, setDriverEta] = useState<string | null>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const driverPhoneRaw = trip?.driver?.phoneNumber || "";
  const driverPhone = driverPhoneRaw.replace(/[^\d+]/g, "");
  const driverPhoneForWhatsApp = driverPhone.replace(/^\+/, "");
  const driverInitials = [
    trip?.driver?.firstName?.[0],
    trip?.driver?.lastName?.[0],
  ]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  // ============= GET PASSENGER LOCATION & SEND UPDATES =============
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Location permission not granted");
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const newLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };

        setPassengerLocation(newLocation);

        // Send location to backend every 4 seconds
        const locationInterval = setInterval(async () => {
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            setPassengerLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });

            // Update backend
            if (tripId) {
              await RideService.updatePassengerLocation({
                rideId: tripId,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          } catch (error) {
            console.error("Error sending passenger location:", error);
          }
        }, 4000);

        return () => clearInterval(locationInterval);
      } catch (error) {
        console.error("Error getting passenger location:", error);
      }
    })();
  }, [tripId]);

  // ============= POLL TRIP STATUS =============
  useEffect(() => {
    if (!tripId) return;

    const pollTrip = async () => {
      try {
        const response = await RideService.getLiveRideState(tripId);
        if (response.success && response.data) {
          const liveState =
            response.data?.data?.data ?? response.data?.data ?? response.data;

          if (liveState?.driver) {
            setTrip((prev) => ({
              ...(prev || ({} as Trip)),
              id: liveState.rideId || prev?.id || tripId,
              status: liveState.status,
              driver: {
                ...liveState.driver,
                fullName: [
                  liveState.driver.firstName,
                  liveState.driver.lastName,
                ]
                  .filter(Boolean)
                  .join(" "),
                licensePlate:
                  liveState.driver.plateNumber || liveState.driver.licensePlate,
              },
              user: liveState.rider
                ? {
                    ...liveState.rider,
                    fullName: [
                      liveState.rider.firstName,
                      liveState.rider.lastName,
                    ]
                      .filter(Boolean)
                      .join(" "),
                  }
                : prev?.user,
            }));
          }

          // Update driver location from live state
          if (liveState.driverLocation) {
            setDriverLocation(liveState.driverLocation);

            // Calculate ETA based on distance
            if (passengerLocation && liveState.driverLocation) {
              const latDiff = Math.abs(
                liveState.driverLocation.latitude - passengerLocation.latitude,
              );
              const lngDiff = Math.abs(
                liveState.driverLocation.longitude -
                  passengerLocation.longitude,
              );
              const distKm =
                Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
              const etaMinutes = Math.ceil(distKm * 2);
              setDriverEta(`${etaMinutes} min`);
            }
          }

          // Update confirmation status
          if (liveState.passengerMetConfirmed) {
            setIsConfirmed(true);
          }

          // If both confirmed or trip in progress, navigate
          if (
            liveState.status === "IN_PROGRESS" ||
            liveState.status === "MET_CONFIRMED" ||
            (liveState.driverMetConfirmed && liveState.passengerMetConfirmed)
          ) {
            router.replace("/(passenger)/home");
          }

          // If trip cancelled, navigate back
          if (liveState.status === "CANCELLED") {
            toast.show({
              type: "warning",
              title: "Trip Cancelled",
              message: "The driver cancelled the trip.",
            });
            router.replace("/(passenger)/home");
          }

          setIsLoadingTrip(false);
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
  }, [tripId, passengerLocation]);

  // ============= CONFIRM MEETING =============
  const handleConfirmMeet = async () => {
    if (!tripId || isConfirmed) return;

    setIsConfirming(true);
    try {
      const response = await RideService.confirmPassengerMeet(tripId);

      if (response.success) {
        setIsConfirmed(true);
        toast.show({
          type: "success",
          title: "Confirmed",
          message: "You confirmed meeting the driver.",
        });

        // Polling will handle auto-navigation when both confirmed
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

  const handleCallDriver = async () => {
    if (!driverPhone) {
      toast.show({
        type: "error",
        title: "No phone number",
        message: "Driver phone number is unavailable.",
      });
      return;
    }
    await Linking.openURL(`tel:${driverPhone}`);
  };

  const handleSmsDriver = async () => {
    if (!driverPhone) {
      toast.show({
        type: "error",
        title: "No phone number",
        message: "Driver phone number is unavailable.",
      });
      return;
    }
    await Linking.openURL(`sms:${driverPhone}`);
  };

  const handleWhatsAppDriver = async () => {
    if (!driverPhoneForWhatsApp) {
      toast.show({
        type: "error",
        title: "No phone number",
        message: "Driver phone number is unavailable.",
      });
      return;
    }
    await Linking.openURL(`https://wa.me/${driverPhoneForWhatsApp}`);
  };

  const mapRegion = passengerLocation
    ? {
        latitude: passengerLocation.latitude,
        longitude: passengerLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 6.5244,
        longitude: 3.3792,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  if (isLoadingTrip) {
    return (
      <ThemedView style={styles.container}>
        <InlineLoader color="#6C006C" size={8} />
        <ThemedText style={{ marginTop: 16 }}>
          Loading driver details...
        </ThemedText>
      </ThemedView>
    );
  }

  if (!trip) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText color="#FF3B30">Trip not found</ThemedText>
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
          {/* Passenger Location */}
          {passengerLocation && (
            <Marker
              coordinate={passengerLocation}
              title="Your Location"
              pinColor="#6C006C"
            >
              <View style={styles.passengerMarker}>
                <Ionicons name="location" size={24} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Driver Location */}
          {driverLocation && (
            <Marker
              coordinate={driverLocation}
              title="Driver Location"
              pinColor="#FF9500"
            >
              <View style={styles.driverMarker}>
                <Ionicons name="car" size={24} color="#FFFFFF" />
              </View>
            </Marker>
          )}
        </MapView>
      </View>

      {/* Bottom Sheet with Driver Info & Confirmation */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragIndicator} />

        <ScrollView
          contentContainerStyle={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView p={20} bg="transparent">
            {/* Driver Details */}
            <ThemedText size="lg" weight="bold" color="#6C006C">
              Your Driver
            </ThemedText>

            <ThemedView
              style={styles.driverCard}
              p={16}
              mt={16}
              flexDirection="row"
              align="center"
            >
              <View style={styles.avatarPlaceholder}>
                <ThemedText style={styles.avatarText}>
                  {driverInitials || "DR"}
                </ThemedText>
              </View>
              <ThemedView ml={16} bg="transparent">
                <ThemedText weight="bold">
                  {trip?.driver?.fullName ||
                    [trip?.driver?.firstName, trip?.driver?.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    "Driver"}
                </ThemedText>
                <ThemedText size="sm" color="#687076">
                  ⭐ {trip?.driver?.rating?.toFixed(1) || "0"}
                </ThemedText>
                <ThemedText size="xs" color="#687076" style={{ marginTop: 4 }}>
                  {trip?.driver?.carName} • {trip?.driver?.licensePlate}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.contactCard} p={14} mt={16}>
              <ThemedText size="xs" color="#687076" style={styles.contactTitle}>
                Contact driver
              </ThemedText>
              <ThemedView flexDirection="row" style={styles.contactRow}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleCallDriver}
                >
                  <View style={[styles.contactIcon, styles.callIcon]}>
                    <Ionicons name="call" size={18} color="#0F766E" />
                  </View>
                  <ThemedText size="xs" style={styles.contactLabel}>
                    Call
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleWhatsAppDriver}
                >
                  <View style={[styles.contactIcon, styles.whatsappIcon]}>
                    <Ionicons name="logo-whatsapp" size={18} color="#16A34A" />
                  </View>
                  <ThemedText size="xs" style={styles.contactLabel}>
                    WhatsApp
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleSmsDriver}
                >
                  <View style={[styles.contactIcon, styles.smsIcon]}>
                    <Ionicons name="chatbubbles" size={18} color="#2563EB" />
                  </View>
                  <ThemedText size="xs" style={styles.contactLabel}>
                    SMS
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>

            {/* ETA */}
            {driverEta && (
              <ThemedView style={styles.etaBox} p={16} mt={16} align="center">
                <ThemedText size="sm" color="#687076">
                  Driver Arrival
                </ThemedText>
                <ThemedText size="lg" weight="bold" color="#6C006C">
                  {driverEta}
                </ThemedText>
              </ThemedView>
            )}

            {/* Confirmation Button */}
            <ThemedButton
              text={isConfirmed ? "✓ Confirmed" : "I Have Met Driver"}
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
                Waiting for driver to confirm...
              </ThemedText>
            )}
          </ThemedView>
        </ScrollView>
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
  passengerMarker: {
    backgroundColor: "#6C006C",
    padding: 8,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  driverMarker: {
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
  bottomSheetContent: {
    paddingBottom: 20,
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
  driverCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F1F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  contactTitle: {
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "600",
  },
  contactRow: {
    justifyContent: "space-between",
    gap: 10,
  },
  contactButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    backgroundColor: "#FFFFFF",
  },
  callIcon: {
    backgroundColor: "#ECFDF5",
  },
  whatsappIcon: {
    backgroundColor: "#F0FDF4",
  },
  smsIcon: {
    backgroundColor: "#EFF6FF",
  },
  contactLabel: {
    color: "#11181C",
    fontWeight: "600",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6C006C",
  },
  etaBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  confirmButton: {
    marginTop: 20,
    borderRadius: 20,
    height: 60,
  },
});
