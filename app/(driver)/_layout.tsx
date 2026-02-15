import { Stack } from "expo-router";

export default function DriverLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerShown: false }} />
      <Stack.Screen name="meet-passenger" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
    </Stack>
  );
}
