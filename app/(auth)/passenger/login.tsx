import { useToast } from "@/components/common/toast-provider";
import { ThemedButton } from "@/components/themed-button";
import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AuthService } from "@/services/auth.service";
import { validateEmail, validatePassword } from "@/utils/validation";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

export default function PassengerLoginScreen() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async () => {
    const newErrors = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };
    setErrors(newErrors);

    if (newErrors.email || newErrors.password) return;

    setIsLoading(true);
    try {
      const response = await AuthService.login(form.email, form.password);

      if (response.success) {
        // Since the login response from the new docs only specifies 'token',
        // we might need to fetch the profile to get the role if not provided.
        // However, for now, let's assume successful login goes to passenger home
        // unless we have logic to distinguish.
        toast.show({
          type: "success",
          title: "Welcome back",
          message: "Login successful",
        });
        router.replace("/(passenger)/home");
      } else {
        toast.show({
          type: "error",
          title: "Login failed",
          message: response.message || "Please check your credentials.",
        });
      }
    } catch (error: any) {
      toast.show({
        type: "error",
        title: "Login failed",
        message:
          error.response?.data?.message ||
          "Login failed. Please check your credentials.",
      });
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.header}>
            <ThemedText size="3xl" weight="bold" style={styles.title}>
              Welcome back
            </ThemedText>
            <ThemedText size="md" color="#687076">
              Log in to continue riding.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <ThemedInput
              label="Email Address"
              placeholder="example@email.com"
              value={form.email}
              onChangeText={(val) => {
                setForm({ ...form, email: val });
                if (errors.email) setErrors({ ...errors, email: null });
              }}
              error={errors.email ?? undefined}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />
            <ThemedInput
              label="Password"
              placeholder="••••••••"
              value={form.password}
              onChangeText={(val) => {
                setForm({ ...form, password: val });
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              error={errors.password ?? undefined}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            <TouchableOpacity
              onPress={() => router.push("/(auth)/passenger/forgot-password")}
              style={styles.forgotPassword}
            >
              <ThemedText size="sm" weight="bold" color="#6C006C">
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>

            <ThemedButton
              text="Log In"
              onPress={handleLogin}
              isLoading={isLoading}
              variant="solid"
              style={styles.button}
            />
          </ThemedView>

          <ThemedView style={styles.footer} align="center">
            <ThemedText size="sm">
              Don&apos;t have an account?{" "}
              <Link href="/(auth)/passenger" style={styles.link}>
                <ThemedText size="sm" weight="bold" color="#6C006C">
                  Sign up
                </ThemedText>
              </Link>
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
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
  forgotPassword: {
    marginBottom: 24,
    alignSelf: "flex-end",
  },
  button: {
    marginTop: 16,
    paddingVertical: 20,
    borderRadius: 30,
  },
  footer: {
    marginTop: "auto",
  },
  link: {
    padding: 4,
  },
});
