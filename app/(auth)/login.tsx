import { ThemedText } from '@/components/themed-text';
import { Href, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedView } from '@/components/themed-view';

export default function LoginScreen() {
    const router = useRouter();

    return (
        <ThemedView style={styles.container} layout="center">
            <ThemedText size="3xl" weight="bold" style={styles.title}>Login Screen</ThemedText>

            <ThemedButton
                text="Go to Register"
                onPress={() => router.push('/register')}
                style={styles.button}
                size="md"
            />

            <ThemedButton
                variant="outline"
                text="Go to Onboarding"
                onPress={() => router.push('/(onboarding)' as Href)}
                style={styles.button}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        marginBottom: 40,
    },
    button: {
        width: '100%',
        marginVertical: 5,
    },
});
