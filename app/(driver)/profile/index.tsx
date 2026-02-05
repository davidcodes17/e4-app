import { FullScreenLoader } from "@/components/common/loaders";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AuthService } from "@/services/auth.service";
import { DriverService } from "@/services/driver.service";
import { Driver } from "@/services/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

export default function DriverProfileScreen() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await DriverService.getProfile();
      if (response.success) {
        setDriver(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    router.replace("/(auth)/login");
  };

  const memberSince = driver?.createdAt
    ? new Date(driver.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "—";

  const rating = driver?.rating?.average ?? 0;
  const tripCount = driver?.totalTrips ?? 0;
  const cancelRatePercent = driver?.cancelRate
    ? (driver.cancelRate * 100).toFixed(1)
    : "—";

  if (isLoading) {
    return (
      <FullScreenLoader
        label="Loading profile"
        subLabel="Getting driver details"
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={["#6C006C", "#4B0051"]} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Driver profile</ThemedText>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => router.push("/(driver)/profile/edit")}
          >
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  driver?.profilePhotoUrl ||
                  `https://ui-avatars.com/api/?name=${driver?.firstName}+${driver?.lastName}&background=6C006C&color=fff&size=128`,
              }}
              style={styles.avatar}
            />
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <ThemedText size="xs" style={styles.statusText}>
                Available
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.userName}>
            {driver?.firstName} {driver?.lastName}
          </ThemedText>
          <ThemedText style={styles.userEmail}>{driver?.email}</ThemedText>
          <ThemedText style={styles.userPhone}>
            {driver?.phoneNumber}
          </ThemedText>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>
                {rating > 0 ? rating.toFixed(1) : "—"}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Rating</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{tripCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Trips</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{memberSince}</ThemedText>
              <ThemedText style={styles.statLabel}>Member since</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/(driver)/history")}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="time-outline" size={20} color="#6C006C" />
              </View>
              <ThemedText style={styles.menuText}>Earnings history</ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Vehicle details</ThemedText>
          <View style={styles.detailCard}>
            <View style={styles.detailItem}>
              <ThemedText style={styles.detailLabel}>Vehicle</ThemedText>
              <ThemedText style={styles.detailValue}>
                {driver?.brand} {driver?.model}
              </ThemedText>
            </View>
            <View style={styles.detailItem}>
              <ThemedText style={styles.detailLabel}>Plate number</ThemedText>
              <ThemedText style={styles.detailValue}>
                {driver?.plateNumber}
              </ThemedText>
            </View>
            <View style={styles.detailItem}>
              <ThemedText style={styles.detailLabel}>Color</ThemedText>
              <ThemedText style={styles.detailValue}>
                {driver?.color}
              </ThemedText>
            </View>
            <View style={styles.detailItem}>
              <ThemedText style={styles.detailLabel}>Car name</ThemedText>
              <ThemedText style={styles.detailValue}>
                {driver?.carName}
              </ThemedText>
            </View>
          </View>
        </View>

        {driver?.savedPlaces && driver.savedPlaces.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Favorite Locations
            </ThemedText>
            <View style={styles.menuCard}>
              {driver.savedPlaces.map((place, idx) => (
                <View key={place.id}>
                  <View style={styles.savedPlaceItem}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name={
                          place.label === "HOME"
                            ? "home-outline"
                            : place.label === "WORK"
                              ? "briefcase-outline"
                              : "location-outline"
                        }
                        size={20}
                        color="#6C006C"
                      />
                    </View>
                    <View style={styles.placeContent}>
                      <ThemedText style={styles.placeLabel}>
                        {place.label}
                      </ThemedText>
                      <ThemedText style={styles.placeAddress} numberOfLines={1}>
                        {place.address}
                      </ThemedText>
                    </View>
                  </View>
                  {idx < driver.savedPlaces.length - 1 && (
                    <View style={styles.menuDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {driver?.cancelRate !== undefined && (
          <View style={styles.statsSection}>
            <ThemedText style={styles.sectionTitle}>Reliability</ThemedText>
            <View style={styles.reliabilityCard}>
              <View style={styles.reliabilityItem}>
                <View style={styles.reliabilityIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#1F9D55" />
                </View>
                <View>
                  <ThemedText style={styles.reliabilityValue}>
                    {cancelRatePercent}%
                  </ThemedText>
                  <ThemedText style={styles.reliabilityLabel}>
                    Cancel rate
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <ThemedButton
            text="Log Out"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    height: 220,
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  profileCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: -90,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#FFF",
  },
  statusBadge: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1F9D55",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  statusText: {
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  userPhone: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statsRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F7F5FA",
    alignItems: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1B1B1F",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#7A7A7A",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5F5F66",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F2ECF4",
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: "#1B1B1F",
    fontWeight: "600",
  },
  detailCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    gap: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  savedPlaceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  placeContent: {
    flex: 1,
  },
  placeLabel: {
    fontSize: 15,
    color: "#1B1B1F",
    fontWeight: "600",
  },
  placeAddress: {
    fontSize: 13,
    color: "#7A7A7A",
    marginTop: 2,
  },
  statsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  reliabilityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  reliabilityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reliabilityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  reliabilityValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1B1B1F",
  },
  reliabilityLabel: {
    fontSize: 12,
    color: "#7A7A7A",
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  logoutButton: {
    borderRadius: 18,
    paddingVertical: 14,
  },
});
