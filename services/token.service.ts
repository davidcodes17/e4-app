import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "e4_jwt_token";
const ROLE_KEY = "e4_user_role";

export const TokenService = {
  async saveToken(token: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async getToken() {
    let token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      token = await AsyncStorage.getItem(TOKEN_KEY);
    }
    return token;
  },

  async saveRole(role: string) {
    await SecureStore.setItemAsync(ROLE_KEY, role);
    await AsyncStorage.setItem(ROLE_KEY, role);
  },

  async getRole() {
    let role = await SecureStore.getItemAsync(ROLE_KEY);
    if (!role) {
      role = await AsyncStorage.getItem(ROLE_KEY);
    }
    return role;
  },

  async removeToken() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(ROLE_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(ROLE_KEY);
  },
};
