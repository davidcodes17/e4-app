import { Stack } from 'expo-router';

export default function PassengerLayout() {
    return (
        <Stack>
            <Stack.Screen name="home" options={{ headerShown: false }} />
            <Stack.Screen name="ride-request" options={{ headerShown: false }} />
        </Stack>
    );
}
