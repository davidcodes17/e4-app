import apiClient from "./api-client";

export const RideService = {
  async requestRide(data: {
    fromLocation: string;
    toLocation: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropOffLatitude: number;
    dropOffLongitude: number;
    distance: number;
    duration: string;
    initialFare: number;
  }) {
    const response = await apiClient.post("/api/v1/rides/request", data);
    return response.data;
  },

  async getEstimate(data: {
    pickupLatitude: number;
    pickupLongitude: number;
    dropOffLatitude: number;
    dropOffLongitude: number;
  }) {
    const response = await apiClient.post("/api/v1/rides/estimate", data);
    return response.data;
  },

  async acceptOffer(offerId: string) {
    const response = await apiClient.post(
      `/api/v1/rides/accept-offer/${offerId}`,
    );
    return response.data;
  },
};
