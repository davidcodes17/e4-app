import { ThemedText } from "@/components/themed-text";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

export function InlineLoader({
  color = "#6C006C",
  size = 6,
}: {
  color?: string;
  size?: number;
}) {
  const anim1 = useRef(new Animated.Value(0.3)).current;
  const anim2 = useRef(new Animated.Value(0.3)).current;
  const anim3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const build = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 350,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

    const a1 = build(anim1, 0);
    const a2 = build(anim2, 120);
    const a3 = build(anim3, 240);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [anim1, anim2, anim3]);

  const dotStyle = useMemo(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
    }),
    [color, size],
  );

  return (
    <View style={styles.inlineContainer}>
      {[anim1, anim2, anim3].map((anim, idx) => (
        <Animated.View
          key={idx}
          style={[
            dotStyle,
            styles.dot,
            {
              opacity: anim,
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0.3, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function FullScreenLoader({
  label = "Working on it",
  subLabel = "Just a moment...",
}: {
  label?: string;
  subLabel?: string;
}) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    spinLoop.start();
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [spin, pulse]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.12],
  });

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.55],
  });

  return (
    <View style={styles.fullScreen}>
      <LinearGradient
        colors={["#F7F1FF", "#FFF6F0", "#F7F1FF"]}
        style={styles.fullGradient}
      />

      <View style={styles.loaderCard}>
        <View style={styles.spinnerWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.spinnerRing,
              {
                transform: [{ rotate }],
              },
            ]}
          />
          <View style={styles.centerDot} />
        </View>
        <ThemedText weight="bold" style={styles.label}>
          {label}
        </ThemedText>
        <ThemedText size="sm" color="#687076">
          {subLabel}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    marginHorizontal: 2,
  },
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
  },
  fullGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  loaderCard: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 28,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#0F0F0F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  spinnerWrap: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pulseRing: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#6C006C",
  },
  spinnerRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: "#6C006C",
    borderTopColor: "#FF7A00",
  },
  centerDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#6C006C",
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: "#1B1B1F",
  },
});
