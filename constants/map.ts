/**
 * Default map region for Nigeria.
 * Lagos coordinates - used so the map always opens in Nigeria.
 */
export const NIGERIA_DEFAULT_REGION = {
  latitude: 6.5244, // Lagos, Nigeria
  longitude: 3.3792,
  latitudeDelta: 0.15, // Zoom to show Lagos area / southern Nigeria
  longitudeDelta: 0.15,
} as const;

/** Lagos coordinates for fallbacks */
export const LAGOS_COORDS = {
  latitude: 6.5244,
  longitude: 3.3792,
} as const;
