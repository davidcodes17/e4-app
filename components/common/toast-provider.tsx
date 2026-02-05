import { ThemedText } from "@/components/themed-text";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ToastType = "success" | "error" | "info" | "warning";

type ToastOptions = {
  type?: ToastType;
  title?: string;
  message?: string;
  duration?: number;
};

type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message?: string;
  duration: number;
  anim: Animated.Value;
};

type ToastContextValue = {
  show: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

const toastStyles: Record<
  ToastType,
  { bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  success: { bg: "#1B8A5A", icon: "checkmark-circle" },
  error: { bg: "#D64545", icon: "close-circle" },
  info: { bg: "#3B82F6", icon: "information-circle" },
  warning: { bg: "#F59E0B", icon: "warning" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((item) => item.id === id);
      if (!toast) return prev;

      Animated.timing(toast.anim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      });

      return prev;
    });
  }, []);

  const show = useCallback(
    ({ type = "info", title, message, duration = 2600 }: ToastOptions) => {
      const id = `${Date.now()}-${Math.random()}`;
      const anim = new Animated.Value(0);

      const toast: ToastItem = {
        id,
        type,
        title,
        message,
        duration,
        anim,
      };

      setToasts((prev) => [...prev.slice(-2), toast]);

      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      if (duration > 0) {
        setTimeout(() => hideToast(id), duration);
      }
    },
    [hideToast],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        style={[
          styles.viewport,
          {
            paddingTop: insets.top + 12,
          },
        ]}
      >
        {toasts.map((toast) => {
          const config = toastStyles[toast.type];
          const translateY = toast.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [-20, 0],
          });

          return (
            <Animated.View
              key={toast.id}
              style={[
                styles.toast,
                {
                  backgroundColor: config.bg,
                  opacity: toast.anim,
                  transform: [{ translateY }],
                },
              ]}
            >
              <Ionicons name={config.icon} size={20} color="#FFFFFF" />
              <View style={styles.toastText}>
                {toast.title ? (
                  <ThemedText weight="bold" style={styles.toastTitle}>
                    {toast.title}
                  </ThemedText>
                ) : null}
                {toast.message ? (
                  <ThemedText size="sm" style={styles.toastMessage}>
                    {toast.message}
                  </ThemedText>
                ) : null}
              </View>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 9999,
    ...Platform.select({
      android: { elevation: 10 },
    }),
  },
  toast: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  toastText: {
    flex: 1,
  },
  toastTitle: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  toastMessage: {
    color: "#F7F7F7",
  },
});
