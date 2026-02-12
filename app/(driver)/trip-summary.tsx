import { InlineLoader } from "@/components/common/loaders";
import { useToast } from "@/components/common/toast-provider";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RideService } from "@/services/ride.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

/**
 * TripSummaryScreen - Trip Summary for Driver
 *
 * IMPLEMENTATION:
 * - Displays trip details (distance, duration, fare, etc.)
 * - Shows passenger info
 * - "Done" button to return to home screen
 *
 * API Endpoints Used:
 * - GET /api/rides/{rideId}/live - Fetch final trip details
 */

interface TripSummary {
  rideId: string;
  status: string;
  distance: number;
  duration: number;
  fare: number;
  pickupLocation: string;
  dropOffLocation: string;
  passengerName?: string;
  rating?: number;
  completedAt?: string;
}

export default function DriverTripSummaryScreen() {
  const router = useRouter();
  const toast = useToast();
  const { rideId } = useLocalSearchParams<{
    rideId: string;
  }>();

  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch trip summary on mount
  useEffect(() => {
    if (!rideId) {
      toast.show({
        type: "error",
        title: "Error",
        message: "Ride ID is missing.",
      });
      router.back();
      return;
    }

    const fetchTripSummary = async () => {
      try {
        const response = await RideService.getLiveRideState(rideId);

        if (response.success && response.data) {
          const data = response.data;

          // Mock trip summary for now (backend should provide comprehensive summary)
          setTripSummary({
            rideId: data.rideId,
            status: data.status,
            distance: 12.5, // Mock data
            duration: 25, // Mock data
            fare: 3500, // Mock data
            pickupLocation: "Lekki Phase 1, Lagos",
            dropOffLocation: "Victoria Island, Lagos",
            passengerName: "Jane Smith",
            rating: 4.8,
            completedAt: new Date().toISOString(),
          });

          console.log("✅ Trip summary loaded");
        }
      } catch (error: any) {
        console.error("❌ Failed to fetch trip summary:", error);
        toast.show({
          type: "error",
          title: "Error",
          message: "Failed to load trip summary.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTripSummary();
  }, [rideId]);

  const handleDone = () => {
    router.replace("/(driver)/home");
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView flex={1} justify="center" align="center" bg="transparent">
          <InlineLoader color="#6C006C" size={8} />
          <ThemedText style={{ marginTop: 16 }}>
            Loading trip summary...
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (!tripSummary) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView
          flex={1}
          justify="center"
          align="center"
          bg="transparent"
          px={24}
        >
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <ThemedText size="lg" weight="bold" style={{ marginTop: 16 }}>
            Trip Not Found
          </ThemedText>
          <ThemedText color="#687076" align="center" style={{ marginTop: 8 }}>
            Could not load trip summary.
          </ThemedText>
          <ThemedButton
            text="Go Home"
            onPress={handleDone}
            style={{ marginTop: 24, width: "100%" }}
          />
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Success Icon */}
          <ThemedView align="center" mb={24} bg="transparent">
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle" size={64} color="#34D399" />
            </View>
            <ThemedText size="3xl" weight="bold" style={styles.title}>
              Trip Completed
            </ThemedText>
            <ThemedText color="#687076" align="center">
              Great job completing the trip!
            </ThemedText>
          </ThemedView>

          {/* Trip Details Card */}
          <ThemedView style={styles.card} p={20} mb={16}>
            <ThemedText weight="bold" size="lg" mb={16}>
              Trip Details
            </ThemedText>

            {/* Route Info */}
            <ThemedView mb={16} bg="transparent">
              <View style={styles.routeRow}>
                <View style={styles.pickupDot} />
                <ThemedView ml={12} bg="transparent" flex={1}>
                  <ThemedText size="sm" color="#687076">
                    Pickup
                  </ThemedText>
                  <ThemedText weight="bold">
                    {tripSummary.pickupLocation}
                  </ThemedText>
                </ThemedView>
              </View>
              <View style={styles.routeConnector} />
              <View style={styles.routeRow}>
                <View style={styles.dropOffDot} />
                <ThemedView ml={12} bg="transparent" flex={1}>
                  <ThemedText size="sm" color="#687076">
                    Drop-off
                  </ThemedText>
                  <ThemedText weight="bold">
                    {tripSummary.dropOffLocation}
                  </ThemedText>
                </ThemedView>
              </View>
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
                <ThemedText weight="bold">{tripSummary.distance} km</ThemedText>
              </ThemedView>
              <ThemedView bg="transparent" align="center">
                <ThemedText size="sm" color="#687076">
                  Duration
                </ThemedText>
                <ThemedText weight="bold">
                  {tripSummary.duration} mins
                </ThemedText>
              </ThemedView>
              <ThemedView bg="transparent" align="center">
                <ThemedText size="sm" color="#687076">
                  Earnings
                </ThemedText>
                <ThemedText weight="bold" color="#34D399">
                  ₦{tripSummary.fare.toLocaleString()}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Passenger Info Card */}
          <ThemedView style={styles.card} p={20} mb={16}>
            <ThemedView flexDirection="row" align="center" bg="transparent">
              <View style={styles.avatar} />
              <ThemedView ml={12} bg="transparent" flex={1}>
                <ThemedText weight="bold" size="lg">
                  {tripSummary.passengerName}
                </ThemedText>
                <ThemedText size="sm" color="#687076">
                  Passenger
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Status Badge */}
          <ThemedView style={styles.statusBadge} py={12} px={16} mb={32}>
            <ThemedText weight="bold" color="#34D399" align="center">
              ✓ {tripSummary.status}
            </ThemedText>
          </ThemedView>

          {/* Done Button */}
          <ThemedButton
            text="Done"
            onPress={handleDone}
            style={styles.doneButton}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 60,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#34D399",
  },
  dropOffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  routeConnector: {
    width: 2,
    height: 24,
    backgroundColor: "#D1D5DB",
    marginLeft: 5,
    marginVertical: 4,
  },
  statsRow: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E5E7EB",
  },
  statusBadge: {
    borderRadius: 16,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
  },
  doneButton: {
    borderRadius: 20,
    height: 60,
  },
});
