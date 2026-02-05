export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
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
  profilePhotoUrl?: string;
  rating?: UserRating;
  totalTrips?: number;
  cancelRate?: number;
  savedPlaces?: SavedPlace[];
  createdAt: string;
}

export interface Driver extends User {
  carName: string;
  plateNumber: string;
  model: string;
  brand: string;
  year: number;
  color: string;
}

export interface Trip {
  id: string;
  fromLocation: string;
  toLocation: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropOffLatitude: number;
  dropOffLongitude: number;
  distance: number;
  duration: string;
  initialFare: number;
  status:
    | "REQUESTED"
    | "ACCEPTED"
    | "ARRIVED"
    | "ONGOING"
    | "COMPLETED"
    | "CANCELLED";
  userId: string;
  driverId?: string;
  createdAt: string;
}

export interface EstimateData {
  distance: number;
  duration: number;
  estimate: number;
  currency: string;
}
