import "dotenv/config";
import appJson from "./app.json";

export default ({ config }) => {
  return {
    ...config,
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
        "AIzaSyAqehj9okkEIzLDLjCgwzMl_geFYvZmdUc",
    },
    android: {
      ...appJson.expo.android,
      ...config.android,
    },
    ios: {
      ...appJson.expo.ios,
      ...config.ios,
      bundleIdentifier: "com.david-codes.e4",
    },
  };
};
