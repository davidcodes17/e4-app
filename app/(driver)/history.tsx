import { FullScreenLoader } from "@/components/common/loaders";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RideService } from "@/services/ride.service";
import { Trip } from "@/services/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

const StatusBadge = ({ status }: { status: Trip["status"] }) => {
  const colors = {
    COMPLETED: "#4CAF50",
    CANCELLED: "#F44336",
    REQUESTED: "#2196F3",
    ACCEPTED: "#FF9800",
    ARRIVED: "#FFC107",
    ONGOING: "#9C27B0",
  };

  return (
    <View style={[styles.badge, { backgroundColor: colors[status] + "20" }]}>
      <ThemedText style={[styles.badgeText, { color: colors[status] }]}>
        {status}
      </ThemedText>
    </View>
  );
};

export default function DriverHistoryScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      // Fetch authenticated user's trip history using JWT
      const response = await RideService.getMyTrips();
      if (response.success) {
        setTrips(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTripItem = ({ item }: { item: Trip }) => (
    <TouchableOpacity style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <View style={styles.dateTime}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <ThemedText style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </ThemedText>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeLine}>
          <View style={[styles.dot, { backgroundColor: "#6C006C" }]} />
          <View style={styles.dash} />
          <View style={[styles.dot, { backgroundColor: "#FF8000" }]} />
        </View>
        <View style={styles.locations}>
          <ThemedText numberOfLines={1} style={styles.locationText}>
            {item.fromLocation}
          </ThemedText>
          <ThemedText numberOfLines={1} style={styles.locationText}>
            {item.toLocation}
          </ThemedText>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <View>
          <ThemedText style={styles.priceLabel}>Earnings</ThemedText>
          <ThemedText style={styles.priceText}>
            ₦{item.initialFare.toLocaleString()}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <FullScreenLoader
        label="Loading trips"
        subLabel="Fetching your earnings history"
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText size="2xl" weight="bold">
          Trip History
        </ThemedText>
      </View>

      {trips.length > 0 ? (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Ionicons name="car-outline" size={64} color="#EEE" />
          <ThemedText style={styles.emptyText}>
            You haven&apos;t completed any trips yet.
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  backButton: {
    marginRight: 15,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  listContent: {
    padding: 20,
  },
  tripCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  dateTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  routeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 15,
  },
  routeLine: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dash: {
    width: 1,
    flex: 1,
    backgroundColor: "#EEE",
    marginVertical: 4,
  },
  locations: {
    flex: 1,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
  },
  tripFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  priceLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6C006C",
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
