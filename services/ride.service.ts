import apiClient from "./api-client";
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
    const response = await apiClient.get("/api/v1/trips/my-trips");
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
};
