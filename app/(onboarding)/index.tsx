import { ThemedButton } from '@/components/themed-button';
import { ThemedImage } from '@/components/themed-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const OnboardingScreen = () => {
    const router = useRouter();
    const carTranslateX = useSharedValue(500);
    const carTranslateY = useSharedValue(0);

    const animatedCarStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: carTranslateX.value },
            { translateY: carTranslateY.value }
        ]
    }));

    useEffect(() => {
        // Drive in from right
        carTranslateX.value = withSpring(0, {
            damping: 12,
            stiffness: 90,
        });

        // Start floating/hovering after a slight delay
        carTranslateY.value = withDelay(
            1000,
            withRepeat(
                withSequence(
                    withTiming(-15, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                    withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
                ),
                -1, // Infinite repeat
                true // Reverse
            )
        );
    }, []);

    return (
        <LinearGradient
            colors={['#000000', '#6C006C']}
            style={{ flex: 1, position: "relative" }}
        >
            <ThemedView flex={1} px={24} pt={20} pb={40} justify="flex-end" gap={30} bg="transparent">
                {/* Hero Image Section */}
                <ThemedView flex={1} justify="center" position='absolute' top={300} left={0} right={0} align="center" bg="transparent">
                    <Animated.View style={[{ width: '100%', height: 300, justifyContent: 'center', alignItems: 'center' }, animatedCarStyle]}>
                        <ThemedImage
                            w="100%"
                            h="100%"
                            source={require('@/assets/images/car.svg')}
                            contentFit="contain"
                        />
                    </Animated.View>
                </ThemedView>

                {/* Content Section */}
                <ThemedView w="100%" bg="transparent">
                    <ThemedText textAlign="center" size="3xl" weight="bold" mb={12} color="white">
                        Smarter Rides for Everyday Life
                    </ThemedText>
                    <ThemedText textAlign="center" size="md" color="#E0E0E0" lineHeight={24}>
                        From quick trips to long journeys, E4 connects you with trusted drivers at fair prices.
                    </ThemedText>
                </ThemedView>

                {/* Action Buttons */}
                <ThemedView gap={20} bg="transparent">
                    <ThemedView flexDirection="row" gap={16} bg="transparent">
                        <ThemedButton
                            flex={1}
                            variant="outline"
                            borderColor="white"
                            borderRadius={30}
                            py={16}
                            justify="center"
                            onPress={() => router.push('/(auth)/driver')}
                        >
                            <ThemedText color="white" size="md" weight="bold">Driver</ThemedText>
                        </ThemedButton>

                        <ThemedButton
                            flex={1}
                            variant="solid"
                            bg="white"
                            borderRadius={30}
                            py={16}
                            justify="center"
                            onPress={() => router.push('/(auth)/passenger')}
                        >
                            <ThemedText color="#6C006C" size="md" weight="bold">Passenger</ThemedText>
                        </ThemedButton>
                    </ThemedView>

                    {/* Footer Link */}
                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/passenger/login')}
                        style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                    >
                        <ThemedText size="sm" color="#E0E0E0">Already have an account? </ThemedText>
                        <ThemedText size="sm" color="white" weight="bold">Login</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </ThemedView>
        </LinearGradient>
    );
};

export default OnboardingScreen;