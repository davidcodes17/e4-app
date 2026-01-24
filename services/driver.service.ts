import apiClient from "./api-client";
import { TokenService } from "./token.service";

export const DriverService = {
  async sendOtp(email: string) {
    const response = await apiClient.post("/api/v1/driver/send-otp", { email });
    return response.data;
  },

  async validateOtp(email: string, otp: string) {
    const response = await apiClient.post("/api/v1/driver/validate-otp", {
      email,
      otp,
    });
    // The token is nested: response.data.data.data.accessToken
    const token = response.data?.data?.data?.accessToken;
    if (token) {
      await TokenService.saveToken(token);
    }
    return response.data;
  },

  async registerDriver(data: any) {
    const response = await apiClient.post(
      "/api/v1/driver/create-account",
      data,
    );
    if (response.data.token) {
      await TokenService.saveToken(response.data.token);
    }
    return response.data;
  },

  async login(emailAddress: string, password: string) {
    const response = await apiClient.post("/api/v1/driver/login", {
      emailAddress,
      password,
    });
    const token = response.data?.data?.accessToken;
    const role = response.data?.data?.role;

    if (token) {
      await TokenService.saveToken(token);
    }
    if (role) {
      await TokenService.saveRole(role);
    }
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get("/api/v1/driver/profile");
    return response.data;
  },
};
