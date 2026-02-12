import apiClient from "./api-client";
import { TokenService } from "./token.service";
import { ApiResponse, EstimateData, PriceOffer, Trip } from "./types";

export const RideService = {
  async requestRide(data: any): Promise<ApiResponse<Trip>> {
    const response = await apiClient.post("/api/v1/rides/request", data);
    return response.data;
  },

  async getEstimate(data: {
    pickupLatitude: number;
    pickupLongitude: number;
    dropOffLatitude: number;
    dropOffLongitude: number;
  }): Promise<ApiResponse<EstimateData>> {
    const response = await apiClient.post("/api/v1/rides/estimate", data);
    // If the backend double-nests: { data: { data: { ... } } }
    // we return the top level ApiResponse but the component might expect unwrapped data.
    return response.data;
  },

  async getMyTrips(): Promise<ApiResponse<Trip[]>> {
    // Fetch authenticated user's trips (no email param needed, uses JWT)
    const response = await apiClient.get("/api/v1/trips/my-trips", {
      headers: {
        Authorization: `Bearer ${await TokenService.getToken()}`,
      },
    });
    // API returns nested structure: { success, data: { isSuccess, data: [trips] } }
    const apiResponse = response.data;
    const trips = apiResponse?.data?.data || [];

    return {
      success: apiResponse.success,
      message: apiResponse.message,
      data: trips,
      timestamp: apiResponse.timestamp,
    };
  },

  async getTrips(email: string): Promise<ApiResponse<Trip[]>> {
    const response = await apiClient.get(`/api/v1/trips/user?email=${email}`);
    return response.data;
  },

  async getDriverTrips(driverId: string): Promise<ApiResponse<Trip[]>> {
    const response = await apiClient.get(`/api/v1/trips/driver/${driverId}`);
    return response.data;
  },

  /**
   * Passenger accepts a driver's price offer
   */
  async acceptOffer(offerId: string) {
    const response = await apiClient.post(
      `/api/v1/trips/accept-offer/${offerId}`,
    );
    return response.data;
  },

  /**
   * Driver accepts a trip request
   */
  async acceptRideRequest(tripId: string) {
    const response = await apiClient.post(
      `/api/v1/trips/driver/accept-request/${tripId}`,
    );
    return response.data;
  },

  /**
   * Fetch price offers for a specific trip
   * Used for polling instead of WebSocket
   *
   * Response Structure:
   * {
   *   "success": true,
   *   "message": "Offers fetched successfully",
   *   "data": [
   *     {
   *       "id": "offer-123",
   *       "tripId": "trip-456",
   *       "driver": { id, emailAddress, fullName, phoneNumber, profilePhotoUrl, averageRating },
   *       "offeredPrice": 7500.0,
   *       "accepted": false,
   *       "createdAt": "2026-02-05T09:15:00Z"
   *     }
   *   ]
   * }
   */
  async getTripOffers(tripId: string): Promise<ApiResponse<PriceOffer[]>> {
    const response = await apiClient.get(`/api/v1/trips/${tripId}/offers`);
    return response.data;
  },

  /**
   * Fetch current trip status
   * Used for polling to check if trip was accepted/status changed
   */
  async getTripStatus(tripId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/api/v1/trips/${tripId}`);
    return response.data;
  },

  /**
   * Get available ride requests for drivers
   * Used for polling to check for new ride requests
   */
  async getAvailableRides(): Promise<ApiResponse<Trip[]>> {
    const response = await apiClient.get("/api/v1/trips/available");
    const apiResponse = response.data;
    const trips = apiResponse?.data?.data || apiResponse?.data || [];

    return {
      success:
        apiResponse?.success ??
        apiResponse?.isSuccess ??
        apiResponse?.status === "OK",
      message: apiResponse?.message || "Available rides fetched",
      data: trips,
      timestamp: apiResponse?.timestamp || new Date().toISOString(),
    };
  },

  /**
   * Propose price for a trip (driver action)
   */
  async proposePrice(
    tripId: string,
    offeredPrice: number,
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.post("/api/v1/trips/propose-price", {
      tripId,
      offeredPrice,
    });
    return response.data;
  },

  /**
   * Update driver location during active trip
   * PUT /api/rides/{rideId}/driver/location
   */
  async updateDriverLocation(data: {
    rideId: string;
    latitude: number;
    longitude: number;
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.put(
      `/api/rides/${data.rideId}/driver/location`,
      {
        latitude: data.latitude,
        longitude: data.longitude,
      },
    );
    return response.data;
  },

  /**
   * Get live ride state - polling endpoint
   * GET /api/rides/{rideId}/live
   *
   * Response includes:
   * - rideId
   * - status (REQUESTED, ACCEPTED, DRIVER_EN_ROUTE, ARRIVED, MET_CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
   * - driverLocation: { latitude, longitude }
   * - passengerLocation: { latitude, longitude }
   * - driverMetConfirmed: boolean
   * - passengerMetConfirmed: boolean
   */
  async getLiveRideState(rideId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/api/rides/${rideId}/live`);
    return response.data;
  },

  /**
   * Update passenger location during active trip
   */
  async updatePassengerLocation(data: {
    rideId: string;
    latitude: number;
    longitude: number;
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.put(
      `/api/rides/${data.rideId}/passenger/location`,
      {
        latitude: data.latitude,
        longitude: data.longitude,
      },
    );
    return response.data;
  },

  /**
   * Driver confirms meeting with passenger
   * POST /api/rides/{rideId}/driver/confirm-meet
   *
   * If passenger also confirmed, status automatically changes to IN_PROGRESS
   */
  async confirmDriverMeet(rideId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(
      `/api/rides/${rideId}/driver/confirm-meet`,
    );
    return response.data;
  },

  /**
   * Passenger confirms meeting with driver
   * POST /api/rides/{rideId}/passenger/confirm-meet
   *
   * If driver also confirmed, status automatically changes to IN_PROGRESS
   */
  async confirmPassengerMeet(rideId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(
      `/api/rides/${rideId}/passenger/confirm-meet`,
    );
    return response.data;
  },

  /**
   * Cancel a ride request
   * POST /api/rides/{rideId}/cancel
   *
   * Only works for REQUESTED or ACCEPTED rides
   */
  async cancelRide(rideId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/api/rides/${rideId}/cancel`);
    return response.data;
  },

  /**
   * End an active trip
   * POST /api/rides/{rideId}/end
   *
   * Can be called by either driver or passenger
   * Marks trip status as COMPLETED
   * Backend enforces:
   * - Only ride participants can end trip
   * - Cannot end already completed trip
   * - Cannot update location after trip ends
   */
  async endTrip(rideId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/api/rides/${rideId}/end`);
    return response.data;
  },

  /**
   * Submit a review for a completed trip (passenger only)
   * POST /api/rides/{rideId}/review
   *
   * Request Body:
   * {
   *   "rating": 1-5 (number),
   *   "comment": "optional text"
   * }
   *
   * Backend enforces:
   * - Only passengers can review drivers
   * - Trip must be COMPLETED
   * - Cannot submit multiple reviews for same trip
   */
  async submitReview(data: {
    rideId: string;
    rating: number;
    comment?: string;
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/api/rides/${data.rideId}/review`, {
      rating: data.rating,
      comment: data.comment || "",
    });
    return response.data;
  },
};
