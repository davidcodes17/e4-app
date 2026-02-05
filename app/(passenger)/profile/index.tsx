import { FullScreenLoader } from "@/components/common/loaders";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AuthService } from "@/services/auth.service";
import { User } from "@/services/types";
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

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response: any = await AuthService.getProfile();
      if (response.success) {
        setUser(response?.data?.data);
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

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "—";

  const rating = user?.rating?.average ?? 0;
  const tripCount = user?.totalTrips ?? 0;
  const cancelRatePercent = user?.cancelRate
    ? (user.cancelRate * 100).toFixed(1)
    : "—";

  if (isLoading) {
    return (
      <FullScreenLoader
        label="Loading profile"
        subLabel="Fetching your details"
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
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => router.push("/(passenger)/profile/edit")}
          >
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  user?.profilePhotoUrl ||
                  `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6C006C&color=fff&size=128`,
              }}
              style={styles.avatar}
            />
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <ThemedText size="xs" style={styles.statusText}>
                Active
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </ThemedText>
          <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
          <ThemedText style={styles.userPhone}>{user?.phoneNumber}</ThemedText>

          <View style={styles.statsRow}>
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
              onPress={() => router.push("/(passenger)/history")}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="time-outline" size={20} color="#6C006C" />
              </View>
              <ThemedText style={styles.menuText}>Trip history</ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#6C006C"
                />
              </View>
              <ThemedText style={styles.menuText}>Safety & support</ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="settings-outline" size={20} color="#6C006C" />
              </View>
              <ThemedText style={styles.menuText}>Settings</ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
            </TouchableOpacity>
          </View>
        </View>

        {user?.savedPlaces && user.savedPlaces.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Saved Places</ThemedText>
            <View style={styles.menuCard}>
              {user.savedPlaces.map((place, idx) => (
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
                  {idx < user.savedPlaces!.length - 1 && (
                    <View style={styles.menuDivider} />
                  )}
                </View>
              ))}
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
    borderColor: "#FFFFFF",
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
    color: "#1B1B1F",
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
  menuDivider: {
    height: 1,
    backgroundColor: "#F1F1F4",
    marginLeft: 64,
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
