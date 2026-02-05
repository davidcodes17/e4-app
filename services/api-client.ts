import { HOST } from "@/security/api-secured";
import axios from "axios";
import { TokenService } from "./token.service";

const apiClient = axios.create({
  baseURL: HOST,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await TokenService.getToken();
  console.log(token, "SKJSJ");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // We keep the full response for now to avoid breaking existing service logic
    // but in a future refactor we could return response.data.data directly
    return response;
  },
  (error) => {
    // Handle global errors (e.g., 401 logout)
    if (error.response?.status === 401) {
      TokenService.removeToken();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
