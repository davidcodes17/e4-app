export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * TripPhase - Represents the current phase of a trip
 * Used for state transitions and UI updates
 */
export enum TripPhase {
  IDLE = "IDLE",
  DRIVER_ASSIGNED = "DRIVER_ASSIGNED",
  EN_ROUTE_TO_PICKUP = "EN_ROUTE_TO_PICKUP",
  PICKED_UP = "PICKED_UP",
  ON_TRIP = "ON_TRIP",
  COMPLETED = "COMPLETED",
}

export interface NestedApiResponse<T> {
  isSuccess: boolean;
  status: string;
  message: string;
  data: T;
}

export interface LoginData {
  accessToken: string;
  role: "USER" | "DRIVER";
}

export interface OtpTokenData {
  accessToken: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  emailAddress?: string;
  phoneNumber: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  role?: "USER" | "DRIVER";
  profilePhotoUrl?: string | null;
  averageRating?: number | null;
  ratingCount?: number | null;
  totalTrips?: number | null;
  cancelRate?: number | null;
  savedPlacesHome?: string | null;
  savedPlacesWork?: string | null;
  walletBalance?: number | null;
  promoCredits?: number | null;
  lastRideAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  deleted?: boolean;
  enabled?: boolean;
  username?: string;
}

export interface Driver extends User {
  carName: string;
  plateNumber: string;
  model: string;
  brand: string;
  year: number;
  color: string;
}

/**
 * UserInfo - Nested user info in Trip responses
 * Returned when fetching available rides or trip details
 */
export interface UserInfo {
  id: string;
  emailAddress?: string;
  email?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

/**
 * DriverInfo - Nested driver info in Trip responses
 * Can be null if driver hasn't accepted yet
 */
export interface DriverInfo {
  id: string;
  email?: string;
  emailAddress?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  carName?: string;
  licensePlate?: string;
  plateNumber?: string;
  rating?: number;
}

/**
 * Trip/TripResponse - Complete trip details from backend
 * Matches backend TripResponse.java DTO structure
 *
 * Backend Response Example:
 * {
 *   "id": "trip-123",
 *   "status": "REQUESTED",
 *   "fromLocation": "Lagos Island",
 *   "toLocation": "Ikeja",
 *   "distance": 25.5,
 *   "price": 7500.0,
 *   "user": { id, emailAddress, fullName, phoneNumber },
 *   "driver": null (or DriverInfo object),
 *   "createdAt": "2026-02-05T09:15:00Z"
 * }
 */
export interface Trip {
  id: string;
  fromLocation: string;
  toLocation: string;
  distance: number;
  price: number; // ✅ Double (converted from BigDecimal in backend)
  status:
    | "REQUESTED"
    | "ACCEPTED"
    | "ARRIVED"
    | "ONGOING"
    | "COMPLETED"
    | "CANCELLED";
  user: UserInfo;
  driver?: DriverInfo | null;
  createdAt: string;

  // Legacy fields for backwards compatibility (if still used)
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropOffLatitude?: number;
  dropOffLongitude?: number;
  driverLatitude?: number;
  driverLongitude?: number;
  duration?: string;
  initialFare?: number;
  userId?: string;
  driverId?: string;
}

export interface EstimateData {
  distance: number;
  duration: number;
  estimate: number;
  currency: string;
}
/**
 * PriceOffer - Driver's price proposal for a trip
 * Returned from GET /api/v1/trips/{tripId}/offers
 */
export interface PriceOffer {
  id: string;
  tripId: string;
  driver: {
    id: string;
    emailAddress: string;
    fullName: string;
    phoneNumber: string;
    profilePhotoUrl?: string;
    averageRating?: number;
  };
  offeredPrice: number;
  accepted: boolean;
  createdAt: string;
}
