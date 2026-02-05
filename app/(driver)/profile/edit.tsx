import { FullScreenLoader } from "@/components/common/loaders";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { DriverService } from "@/services/driver.service";
import { Driver } from "@/services/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function DriverEditProfileScreen() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    carName: "",
    plateNumber: "",
    model: "",
    brand: "",
    color: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await DriverService.getProfile();
      if (response.success) {
        setDriver(response.data);
        const d = response.data;
        setForm({
          firstName: d.firstName,
          lastName: d.lastName,
          phoneNumber: d.phoneNumber,
          carName: d.carName,
          plateNumber: d.plateNumber,
          model: d.model,
          brand: d.brand,
          color: d.color,
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await DriverService.updateProfile(form);
      if (response.success) {
        router.back();
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText size="2xl" weight="bold">
          Edit Profile
        </ThemedText>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText style={styles.sectionTitle}>
            Personal Information
          </ThemedText>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>First Name</ThemedText>
              <TextInput
                style={styles.input}
                value={form.firstName}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, firstName: text }))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Last Name</ThemedText>
              <TextInput
                style={styles.input}
                value={form.lastName}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, lastName: text }))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Phone Number</ThemedText>
              <TextInput
                style={styles.input}
                value={form.phoneNumber}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, phoneNumber: text }))
                }
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <ThemedText style={styles.sectionTitle}>Vehicle Details</ThemedText>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Brand</ThemedText>
              <TextInput
                style={styles.input}
                value={form.brand}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, brand: text }))
                }
              />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Model</ThemedText>
              <TextInput
                style={styles.input}
                value={form.model}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, model: text }))
                }
              />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Plate Number</ThemedText>
              <TextInput
                style={styles.input}
                value={form.plateNumber}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, plateNumber: text }))
                }
              />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Color</ThemedText>
              <TextInput
                style={styles.input}
                value={form.color}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, color: text }))
                }
              />
            </View>
          </View>

          <ThemedButton
            text="Save Changes"
            onPress={handleSave}
            isLoading={isSaving}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    marginRight: 15,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6C006C",
    marginTop: 10,
    marginBottom: 15,
    textTransform: "uppercase",
  },
  form: {
    gap: 15,
    marginBottom: 30,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  input: {
    height: 52,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  saveButton: {
    marginTop: 10,
    marginBottom: 30,
  },
});
