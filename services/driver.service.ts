import apiClient from "./api-client";
import { TokenService } from "./token.service";
import { ApiResponse, Driver, LoginData, NestedApiResponse } from "./types";

export const DriverService = {
  async createAccount(data: any): Promise<ApiResponse<Driver>> {
    const response = await apiClient.post(
      "/api/v1/driver/create-account",
      data,
    );
    return response.data;
  },

  async login(
    emailAddress: string,
    password: string,
  ): Promise<ApiResponse<NestedApiResponse<LoginData>>> {
    const response = await apiClient.post("/api/v1/auth/login", {
      emailAddress,
      password,
    });

    const token =
      response.data?.data?.accessToken ||
      response.data?.data?.data?.accessToken;
    const role =
      response.data?.data?.role || response.data?.data?.data?.role || "DRIVER"; // Default to DRIVER since this is driver login

    if (token) {
      await TokenService.saveToken(token);
    }

    // Save role for proper navigation and permissions
    if (role) {
      await TokenService.saveRole(role);
    }

    return response.data;
  },

  async getProfile(): Promise<ApiResponse<Driver>> {
    const response = await apiClient.get("/api/v1/driver/profile");
    return response.data;
  },
  async updateProfile(data: Partial<Driver>): Promise<ApiResponse<Driver>> {
    const response = await apiClient.put("/api/v1/driver/profile", data);
    return response.data;
  },
};
