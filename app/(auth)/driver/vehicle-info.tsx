import { ThemedButton } from "@/components/themed-button";
import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { DriverService } from "@/services/driver.service";
import { validateRequired } from "@/utils/validation";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";

export default function DriverVehicleInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [form, setForm] = useState({
    vehicleName: "",
    brand: "",
    model: "",
    year: "",
    color: "",
    plateNumber: "",
  });

  const handleRegister = async () => {
    const newErrors = {
      brand: validateRequired(form.brand, "Brand"),
      model: validateRequired(form.model, "Model"),
      plateNumber: validateRequired(form.plateNumber, "Plate Number"),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err !== null)) return;
    setIsLoading(true);
    try {
      const registerResponse = await DriverService.createAccount({
        firstName: params.firstName,
        lastName: params.lastName,
        middleName: params.middleName,
        phoneNumber: params.phoneNumber,
        password: params.password,
        gender: params.gender?.toUpperCase(),
        brand: form.brand,
        model: form.model,
        year: parseInt(form.year, 10) || 2022,
        color: form.color,
        plateNumber: form.plateNumber,
        carName: form.vehicleName || `${form.brand} ${form.model}`,
      });

      console.log(registerResponse, "SJJS");

      if (registerResponse.success) {
        router.replace("/(driver)/home");
      } else {
        Alert.alert(
          "Error",
          registerResponse.message || "Registration failed.",
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Registration failed.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.header}>
            <ThemedText size="3xl" weight="bold" style={styles.title}>
              Vehicle details
            </ThemedText>
            <ThemedText size="md" color="#687076">
              Provide information about your vehicle.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <ThemedInput
              label="Vehicle Name"
              placeholder="My Car"
              value={form.vehicleName}
              onChangeText={(val) => setForm({ ...form, vehicleName: val })}
            />
            <ThemedView flexDirection="row" style={styles.row}>
              <ThemedView style={{ flex: 1, marginRight: 8 }}>
                <ThemedInput
                  label="Brand"
                  placeholder="Toyota"
                  value={form.brand}
                  onChangeText={(val) => {
                    setForm({ ...form, brand: val });
                    if (errors.brand) setErrors({ ...errors, brand: null });
                  }}
                  error={errors.brand ?? undefined}
                />
              </ThemedView>
              <ThemedView style={{ flex: 1, marginLeft: 8 }}>
                <ThemedInput
                  label="Model"
                  placeholder="Corolla"
                  value={form.model}
                  onChangeText={(val) => {
                    setForm({ ...form, model: val });
                    if (errors.model) setErrors({ ...errors, model: null });
                  }}
                  error={errors.model ?? undefined}
                />
              </ThemedView>
            </ThemedView>

            <ThemedView flexDirection="row" style={styles.row}>
              <ThemedView style={{ flex: 1, marginRight: 8 }}>
                <ThemedInput
                  label="Year"
                  placeholder="2022"
                  value={form.year}
                  onChangeText={(val) => setForm({ ...form, year: val })}
                  keyboardType="number-pad"
                />
              </ThemedView>
              <ThemedView style={{ flex: 1, marginLeft: 8 }}>
                <ThemedInput
                  label="Color"
                  placeholder="White"
                  value={form.color}
                  onChangeText={(val) => setForm({ ...form, color: val })}
                />
              </ThemedView>
            </ThemedView>

            <ThemedInput
              label="Plate Number"
              placeholder="KJA-123-AB"
              value={form.plateNumber}
              onChangeText={(val) => {
                setForm({ ...form, plateNumber: val });
                if (errors.plateNumber)
                  setErrors({ ...errors, plateNumber: null });
              }}
              error={errors.plateNumber ?? undefined}
              autoCapitalize="characters"
            />

            <ThemedButton
              text="Register as Driver"
              onPress={handleRegister}
              isLoading={isLoading}
              variant="solid"
              style={styles.button}
            />
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
  },
  form: {
    flex: 1,
  },
  row: {
    width: "100%",
  },
  button: {
    marginTop: 24,
    marginBottom: 40,
  },
});
