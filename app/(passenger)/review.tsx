import { InlineLoader } from "@/components/common/loaders";
import { useToast } from "@/components/common/toast-provider";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RideService } from "@/services/ride.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

/**
 * PassengerReviewScreen - Rate Driver After Trip
 *
 * IMPLEMENTATION:
 * - Star rating selector (1-5 stars)
 * - Comment text input
 * - Submit review button
 * - Navigate to trip summary after submission
 *
 * API Endpoints Used:
 * - POST /api/rides/{rideId}/review - Submit review
 */

export default function PassengerReviewScreen() {
  const router = useRouter();
  const toast = useToast();
  const { rideId, driverName } = useLocalSearchParams<{
    rideId: string;
    driverName: string;
  }>();

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // ============= SUBMIT REVIEW HANDLER =============
  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.show({
        type: "warning",
        title: "Rating required",
        message: "Please select a star rating before submitting.",
      });
      return;
    }

    if (!rideId) {
      toast.show({
        type: "error",
        title: "Error",
        message: "Ride ID is missing.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await RideService.submitReview({
        rideId,
        rating,
        comment: comment.trim(),
      });

      if (response.success) {
        console.log("✅ Review submitted successfully");

        toast.show({
          type: "success",
          title: "Review submitted",
          message: "Thank you for your feedback!",
        });

        // Navigate to trip summary
        router.replace({
          pathname: "/(passenger)/trip-summary",
          params: { rideId },
        });
      }
    } catch (error: any) {
      console.error("❌ Failed to submit review:", error);
      toast.show({
        type: "error",
        title: "Review failed",
        message: error.response?.data?.message || "Failed to submit review.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============= SKIP REVIEW HANDLER =============
  const handleSkipReview = () => {
    router.replace({
      pathname: "/(passenger)/trip-summary",
      params: { rideId },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <ThemedView align="center" mb={32} bg="transparent">
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={48} color="#34D399" />
          </View>
          <ThemedText size="3xl" weight="bold" style={styles.title}>
            Trip Completed
          </ThemedText>
          <ThemedText color="#687076" align="center">
            How was your ride with {driverName || "your driver"}?
          </ThemedText>
        </ThemedView>

        {/* Star Rating Selector */}
        <ThemedView mb={32} bg="transparent">
          <ThemedText weight="bold" mb={12}>
            Rate Your Experience
          </ThemedText>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={48}
                  color={star <= rating ? "#FFD700" : "#D1D5DB"}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <ThemedText
              align="center"
              color="#687076"
              size="sm"
              style={styles.ratingText}
            >
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </ThemedText>
          )}
        </ThemedView>

        {/* Comment Text Input */}
        <ThemedView mb={32} bg="transparent">
          <ThemedText weight="bold" mb={12}>
            Additional Comments (Optional)
          </ThemedText>
          <TextInput
            style={styles.textInput}
            placeholder="Share your experience with us..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />
        </ThemedView>

        {/* Submit Button */}
        <ThemedButton
          text={isLoading ? "Submitting..." : "Submit Review"}
          onPress={handleSubmitReview}
          style={styles.submitButton}
          disabled={isLoading || rating === 0}
        />

        {/* Skip Button */}
        <TouchableOpacity onPress={handleSkipReview} style={styles.skipButton}>
          <ThemedText color="#687076" align="center">
            Skip for now
          </ThemedText>
        </TouchableOpacity>

        {isLoading && (
          <ThemedView py={10} align="center" bg="transparent">
            <InlineLoader color="#6C006C" size={6} />
          </ThemedView>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    marginTop: 12,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 120,
    fontFamily: "System",
  },
  submitButton: {
    borderRadius: 20,
    height: 60,
    marginBottom: 16,
  },
  skipButton: {
    padding: 12,
  },
});
