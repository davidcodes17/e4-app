import "dotenv/config";
import appJson from "./app.json";

export default ({ config }) => {
  return {
    ...config,
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      ...config.android,
    },
    ios: {
      ...appJson.expo.ios,
      ...config.ios,
    },
  };
};
