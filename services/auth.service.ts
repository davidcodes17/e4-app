import apiClient from "./api-client";
import { TokenService } from "./token.service";
import { ApiResponse, User } from "./types";

export const AuthService = {
  async sendOtp(email: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post("/api/v1/auth/send-otp", { email });
    return response.data;
  },

  async validateOtp(email: string, otp: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post("/api/v1/auth/validate-otp", {
      email,
      otp,
    });
    // According to docs, validate-otp response is ApiResponse<Void>
    // but the previous code expected a token here. I'll maintain the return
    // but the token might now be in create-account or login.
    return response.data;
  },

  async createAccount(data: any): Promise<ApiResponse<User>> {
    const response = await apiClient.post("/api/v1/auth/create-account", data);
    // If the response contains a token (e.g. in message or hidden data), we'd save it.
    // However, the docs say it returns ApiResponse<User>.
    // If the token is returned in the 'data' or as a header, we should handle it.
    // For now, I'll follow the doc structure.
    return response.data;
  },

  async login(
    emailAddress: string,
    password: string,
  ): Promise<ApiResponse<{ token: string; role?: string }>> {
    const response = await apiClient.post("/api/v1/auth/login", {
      emailAddress,
      password,
    });

    // The backend seems to double-nest: ApiResponse.data.data.accessToken
    const token =
      response.data?.data?.accessToken ||
      response.data?.data?.data?.accessToken;

    if (token) {
      await TokenService.saveToken(token);
    }

    return response.data;
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get("/api/v1/auth/profile");
    // API returns nested structure: { success, data: { isSuccess, data: { actual profile } } }
    const apiResponse = response.data;
    const profileData = apiResponse?.data?.data;

    // Map backend response to User type
    if (profileData) {
      const mappedUser: User = {
        id: profileData.id,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        middleName: profileData.middleName,
        emailAddress: profileData.emailAddress,
        phoneNumber: profileData.phoneNumber,
        gender: profileData.gender,
        role: profileData.role,
        profilePhotoUrl: profileData.profilePhotoUrl,
        rating: profileData.averageRating
          ? {
              average: profileData.averageRating,
              count: profileData.ratingCount || 0,
            }
          : undefined,
        totalTrips: profileData.totalTrips,
        cancelRate: profileData.cancelRate,
        walletBalance: profileData.walletBalance,
        promoCredits: profileData.promoCredits,
        savedPlaces: [
          ...(profileData.savedPlacesHome
            ? [
                {
                  id: "home",
                  label: "HOME" as const,
                  address: profileData.savedPlacesHome,
                  latitude: 0,
                  longitude: 0,
                },
              ]
            : []),
          ...(profileData.savedPlacesWork
            ? [
                {
                  id: "work",
                  label: "WORK" as const,
                  address: profileData.savedPlacesWork,
                  latitude: 0,
                  longitude: 0,
                },
              ]
            : []),
        ],
        createdAt: profileData.memberSince,
        updatedAt: profileData.lastRideAt,
      };

      return {
        ...apiResponse,
        data: {
          ...apiResponse.data,
          data: mappedUser,
        },
      };
    }

    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.put("/api/v1/auth/profile", data);
    return response.data;
  },

  async logout() {
    await TokenService.removeToken();
  },
};
