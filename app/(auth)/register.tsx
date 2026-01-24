import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RegisterScreen() {
    const router = useRouter();

    return (
        <ThemedView style={styles.container} layout="center">
            <ThemedText size="3xl" weight="bold" style={styles.title}>Register Screen</ThemedText>

            <ThemedButton
                text="Back to Login"
                onPress={() => router.back()}
                style={styles.button}
                size="md"
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
    },
});
