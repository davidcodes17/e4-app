import { ThemedButton } from "@/components/themed-button";
import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AuthService } from "@/services/auth.service";
import { DriverService } from "@/services/driver.service";
import { TokenService } from "@/services/token.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

export default function DriverOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleVerify = async () => {
    if (!email || otp.length < 6) return;
    setIsLoading(true);
    try {
      const res = await DriverService.validateOtp(email, otp);
      const response: any = res?.data;

      console.log(response, "RESPONE");
      if (res.success) {
        const token = response.data?.accessToken;
        console.log(token, "OTP SIDE");
        if (token) {
          await TokenService.saveToken(token);
        }
        router.push({
          pathname: "/(auth)/driver/personal-info",
          params: { email },
        });
      } else {
        Alert.alert("Error", response.message || "Verification failed");
      }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Invalid code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      const response = await AuthService.resendOtp(email);
      if (response && response.success) {
        setTimer(30);
        Alert.alert("Success", "Verification code resent.");
      } else {
        Alert.alert("Error", response?.message || "Failed to resend code.");
      }
    } catch (error: any) {
      if (error?.response?.status === 409) {
        Alert.alert("Conflict", "An account with that email already exists.");
      } else {
        Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to resend code.",
        );
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.header}>
            <ThemedText size="3xl" weight="bold" style={styles.title}>
              Verify your email
            </ThemedText>
            <ThemedText size="md" color="#687076">
              Enter the verification code sent to your email.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <ThemedInput
              label="Verification Code"
              placeholder="000 000"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              leftIcon="key-outline"
            />

            <ThemedView
              flexDirection="row"
              align="center"
              style={styles.resendContainer}
            >
              <ThemedText size="sm" color="#687076">
                Didn&apos;t receive the code?{" "}
              </ThemedText>
              <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                <ThemedText
                  size="sm"
                  weight="bold"
                  color={timer > 0 ? "#999" : "#6C006C"}
                >
                  {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ThemedButton
              text="Verify"
              onPress={handleVerify}
              isLoading={isLoading}
              variant="solid"
              style={styles.button}
              disabled={otp.length < 6}
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
    justifyContent: "center",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
  },
  form: {
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
    paddingVertical: 12,
  },
  resendContainer: {
    marginBottom: 24,
    justifyContent: "center",
  },
});
