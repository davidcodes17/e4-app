import apiClient from "./api-client";
import { TokenService } from "./token.service";
import {
  ApiResponse,
  LoginData,
  NestedApiResponse,
  OtpTokenData,
  User,
} from "./types";
111842;
export const AuthService = {
  async sendOtp(email: string): Promise<ApiResponse<void>> {
    // Keep send + resend in sync to avoid creating duplicate active OTPs.
    // Backend will resend existing valid OTP or generate a new one if none exists.
    const response = await apiClient.post("/api/v1/auth/send-otp", { email });
    return response.data;
  },

  async validateOtp(
    email: string,
    otp: string,
  ): Promise<ApiResponse<OtpTokenData>> {
    const response = await apiClient.post("/api/v1/auth/validate-otp", {
      email,
      otp,
    });
    console.log(response, "SJSuuuu");
    const token = response?.data?.data?.data?.accessToken;
    console.log(token, "TOKENSS_!");
    if (token) {
      await TokenService.saveToken(token);
      await TokenService.saveRole("USER");
    }
    return response.data;
  },

  /**
   * Resend the latest valid OTP or generate a new one for the given email.
   * Endpoint: POST /api/v1/auth/resend-otp
   * Returns 202 Accepted on success, or 409 Conflict if account already exists.
   */
  async resendOtp(email: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post("/api/v1/auth/resend-otp", { email });
    return response.data;
  },

  async createAccount(data: any): Promise<ApiResponse<OtpTokenData>> {
    const response = await apiClient.post("/api/v1/auth/create-account", data);
    const token = response.data?.data?.accessToken;
    if (token) {
      await TokenService.saveToken(token);
      await TokenService.saveRole("USER");
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

    // The backend seems to double-nest: ApiResponse.data.data.accessToken
    const token =
      response.data?.data?.accessToken ||
      response.data?.data?.data?.accessToken;
    const role = response.data?.data?.role || response.data?.data?.data?.role;

    if (token) {
      await TokenService.saveToken(token);
    }

    // Save role for proper navigation and permissions
    if (role) {
      await TokenService.saveRole(role);
    }

    return response.data;
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get("/api/v1/auth/profile");
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

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.put("/api/v1/auth/profile", data);
    return response.data;
  },

  async logout() {
    await TokenService.removeToken();
  },
};
