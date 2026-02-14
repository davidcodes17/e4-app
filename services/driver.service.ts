import apiClient from "./api-client";
import { TokenService } from "./token.service";
import {
  ApiResponse,
  Driver,
  LoginData,
  NestedApiResponse,
  OtpTokenData,
} from "./types";

export const DriverService = {
  async createAccount(data: any): Promise<ApiResponse<OtpTokenData>> {
    console.log(data, "DATA");
    const response = await apiClient.post(
      "/api/v1/driver/create-account",
      data,
    );
    const token = response.data?.data?.accessToken;
    if (token) {
      await TokenService.saveToken(token);
      await TokenService.saveRole("DRIVER");
    }
    return response.data;
  },

  async validateOtp(
    email: string,
    otp: string,
  ): Promise<ApiResponse<OtpTokenData>> {
    const response = await apiClient.post("/api/v1/driver/validate-otp", {
      email,
      otp,
    });
    const token = response.data?.accessToken;
    if (token) {
      await TokenService.saveToken(token);
      await TokenService.saveRole("DRIVER");
    }
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
    // Handle nested response: response.data.data.data
    if (response.data?.data?.data) {
      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data.data,
        timestamp: response.data.timestamp,
      };
    }
    return response.data;
  },
  async updateProfile(data: Partial<Driver>): Promise<ApiResponse<Driver>> {
    const response = await apiClient.put("/api/v1/driver/profile", data);
    return response.data;
  },
};
