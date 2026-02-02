import apiClient from "./api-client";
import { TokenService } from "./token.service";
import { ApiResponse, Driver } from "./types";

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
  ): Promise<ApiResponse<{ token: string; role?: string }>> {
    const response = await apiClient.post("/api/v1/auth/login", {
      emailAddress,
      password,
    });

    const token =
      response.data?.data?.accessToken ||
      response.data?.data?.data?.accessToken;
    if (token) {
      await TokenService.saveToken(token);
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
