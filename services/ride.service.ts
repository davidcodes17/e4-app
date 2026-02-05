import apiClient from "./api-client";
import { TokenService } from "./token.service";
import { ApiResponse, EstimateData, Trip } from "./types";

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

  async acceptOffer(offerId: string) {
    const response = await apiClient.post(
      `/api/v1/rides/accept-offer/${offerId}`,
    );
    // The doc doesn't mention accept-offer, but I'll keep it as it might be internal or pending doc update.
    return response.data;
  },

  /**
   * Fetch price offers for a specific trip
   * Used for polling instead of WebSocket
   */
  async getTripOffers(tripId: string): Promise<ApiResponse<any[]>> {
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
    const response = await apiClient.get("/api/v1/rides/available");
    return response.data;
  },

  /**
   * Propose price for a trip (driver action)
   */
  async proposePrice(
    tripId: string,
    offeredPrice: number,
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.post("/api/v1/rides/propose-price", {
      tripId,
      offeredPrice,
    });
    return response.data;
  },

  /**
   * Update driver location during active trip
   */
  async updateDriverLocation(data: {
    tripId: string;
    latitude: number;
    longitude: number;
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.post(
      "/api/v1/rides/update-location",
      data,
    );
    return response.data;
  },
};
