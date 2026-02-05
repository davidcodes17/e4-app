export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
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

export interface SavedPlace {
  id: string;
  label: "HOME" | "WORK" | "OTHER";
  address: string;
  latitude: number;
  longitude: number;
}

export interface UserRating {
  average: number;
  count: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  role?: "USER" | "DRIVER";
  profilePhotoUrl?: string;
  rating?: UserRating;
  totalTrips?: number;
  cancelRate?: number;
  savedPlaces?: SavedPlace[];
  walletBalance?: number;
  promoCredits?: number;
  createdAt: string;
  updatedAt?: string;
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
  emailAddress: string;
  fullName: string;
  phoneNumber: string;
}

/**
 * DriverInfo - Nested driver info in Trip responses
 * Can be null if driver hasn't accepted yet
 */
export interface DriverInfo {
  id: string;
  emailAddress: string;
  fullName: string;
  licensePlate?: string;
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
