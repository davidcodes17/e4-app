import { Stack } from 'expo-router';

export default function DriverAuthLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="otp" options={{ headerShown: false }} />
            <Stack.Screen name="personal-info" options={{ headerShown: false }} />
            <Stack.Screen name="vehicle-info" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack>
    );
}
