import apiClient from "./api-client";
import { TokenService } from "./token.service";

export const AuthService = {
  async sendOtp(email: string) {
    const response = await apiClient.post("/api/v1/auth/send-otp", { email });
    return response.data;
  },

  async validateOtp(email: string, otp: string) {
    const response = await apiClient.post("/api/v1/auth/validate-otp", {
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

  async createAccount(data: any) {
    const response = await apiClient.post("/api/v1/auth/create-account", data);
    if (response.data.token) {
      await TokenService.saveToken(response.data.token);
    }
    return response.data;
  },

  async login(emailAddress: string, password: string) {
    const response = await apiClient.post("/api/v1/auth/login", {
      emailAddress,
      password,
    });
    if (response.data.token) {
      await TokenService.saveToken(response.data.token);
    }
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get("/api/v1/auth/profile");
    return response.data;
  },

  async logout() {
    await TokenService.removeToken();
  },
};
