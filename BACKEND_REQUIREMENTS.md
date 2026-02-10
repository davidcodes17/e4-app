# Backend Requirements for Pre-Pickup Navigation & On-Trip Tracking

**Date:** February 8, 2026  
**Project:** E4 Ride-Sharing App  
**Purpose:** Frontend implementation requires specific backend updates to support seamless driver-to-pickup navigation, pickup detection, and on-trip tracking.

---

## Table of Contents

1. [Trip Model Updates](#1-trip-model-updates)
2. [Endpoint Updates & Additions](#2-endpoint-updates--additions)
3. [Status Transition Logic](#3-status-transition-logic)
4. [Location Update Endpoint Logic](#4-location-update-endpoint-logic-critical)
5. [Available Rides Endpoint](#5-available-rides-endpoint)
6. [Response Normalization](#6-response-normalization)
7. [Database Indexes](#7-database-indexes-performance)
8. [Summary & Priority Matrix](#8-summary-of-critical-backend-requirements)

---

## 1. Trip Model Updates

Add/ensure these fields exist in the Trip entity:

### Current Fields (Keep)

```java
@Entity
@Table(name = "trips")
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String status; // REQUESTED, ACCEPTED, ARRIVED, ONGOING, COMPLETED, CANCELLED
    private String fromLocation;
    private String toLocation;
    private Double distance;
    private String duration;
    private BigDecimal price;
    private BigDecimal initialFare;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user; // Passenger

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver; // Driver (null until accepted)

    private String driverId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### NEW Fields to Add

```java
    // ============= PICKUP & DROPOFF LOCATION COORDINATES =============
    @Column(name = "pickup_latitude")
    private Double pickupLatitude;

    @Column(name = "pickup_longitude")
    private Double pickupLongitude;

    @Column(name = "dropoff_latitude")
    private Double dropOffLatitude;

    @Column(name = "dropoff_longitude")
    private Double dropOffLongitude;

    // ============= REAL-TIME DRIVER LOCATION TRACKING =============
    @Column(name = "driver_latitude")
    private Double driverLatitude;

    @Column(name = "driver_longitude")
    private Double driverLongitude;

    @Column(name = "driver_location_timestamp")
    private Long driverLocationTimestamp;

    // ============= REAL-TIME PASSENGER LOCATION TRACKING =============
    @Column(name = "passenger_latitude")
    private Double passengerLatitude;

    @Column(name = "passenger_longitude")
    private Double passengerLongitude;

    @Column(name = "passenger_location_timestamp")
    private Long passengerLocationTimestamp;
```

### Database Migration (SQL)

```sql
ALTER TABLE trips ADD COLUMN pickup_latitude DOUBLE PRECISION;
ALTER TABLE trips ADD COLUMN pickup_longitude DOUBLE PRECISION;
ALTER TABLE trips ADD COLUMN dropoff_latitude DOUBLE PRECISION;
ALTER TABLE trips ADD COLUMN dropoff_longitude DOUBLE PRECISION;
ALTER TABLE trips ADD COLUMN driver_latitude DOUBLE PRECISION;
ALTER TABLE trips ADD COLUMN driver_longitude DOUBLE PRECISION;
ALTER TABLE trips ADD COLUMN driver_location_timestamp BIGINT;
ALTER TABLE trips ADD COLUMN passenger_latitude DOUBLE PRECISION;
ALTER TABLE trips ADD COLUMN passenger_longitude DOUBLE PRECISION;
ALTER TABLE trips ADD COLUMN passenger_location_timestamp BIGINT;
```

---

## 2. Endpoint Updates & Additions

### A. GET /api/v1/trips/{tripId}

**Method:** `GET`  
**Purpose:** Fetch current trip details with live location data  
**Params:** `tripId` (path parameter)  
**Auth:** Required (JWT Token)

**Response:** ✅ MUST include these new fields

```json
{
  "success": true,
  "message": "Trip fetched successfully",
  "data": {
    "isSuccess": true,
    "status": "OK",
    "message": "Trip fetched successfully",
    "data": {
      "id": "0b620f59-1fd5-4d5f-84c2-9868c05b4b6d",
      "status": "ACCEPTED",
      "fromLocation": "Obafemi-Owode, Obafemi-Owode",
      "toLocation": "Adeniran Ogunsanya Street, Surulere, Lagos",

      "pickupLatitude": 6.817922512506482,
      "pickupLongitude": 3.4559627910665514,
      "dropOffLatitude": 6.4253,
      "dropOffLongitude": 3.4041,

      "driverLatitude": 6.51,
      "driverLongitude": 3.38,
      "driverLocationTimestamp": 1707374160000,

      "passengerLatitude": 6.4311,
      "passengerLongitude": 3.4697,
      "passengerLocationTimestamp": 1707374155000,

      "distance": 44.03,
      "duration": "132",
      "price": 13700.0,
      "initialFare": 13700.0,

      "user": {
        "id": "8ea7eca7-56bd-4f82-ba0e-26d93638893e",
        "firstName": "Areegbe",
        "lastName": "David",
        "email": "areegbedavid@gmail.com",
        "phoneNumber": "08000000000"
      },
      "driver": {
        "id": "37c7de9a-d202-45a2-9e87-2e9b4d8b61ce",
        "firstName": "David",
        "lastName": "The Billionaire",
        "email": "davidcodes2005@gmail.com",
        "carName": "Toyota Camry",
        "plateNumber": "EU219ABC",
        "averageRating": 4.8
      },
      "driverId": "37c7de9a-d202-45a2-9e87-2e9b4d8b61ce",
      "createdAt": "2026-02-06T00:26:21.225595Z",
      "updatedAt": "2026-02-06T01:28:02.612504Z"
    }
  },
  "timestamp": "2026-02-06T01:28:02.6125044"
}
```

---

### B. POST /api/v1/rides/update-location

**Method:** `POST`  
**Purpose:** Update driver/passenger location and auto-detect pickup arrival  
**Auth:** Required (JWT Token - determines if driver or passenger)

**Request Body:**

```json
{
  "tripId": "0b620f59-1fd5-4d5f-84c2-9868c05b4b6d",
  "latitude": 6.51,
  "longitude": 3.38
}
```

**Response:**

```json
{
  "success": true,
  "message": "Location updated",
  "data": {
    "data": {
      "tripId": "0b620f59-1fd5-4d5f-84c2-9868c05b4b6d",
      "status": "ARRIVED",
      "message": "Driver arrived at pickup location",
      "driverLatitude": 6.51,
      "driverLongitude": 3.38,
      "distanceToPickup": 45.5
    }
  }
}
```

**Backend Logic:**

```java
@PostMapping("/api/v1/rides/update-location")
public ResponseEntity<?> updateLocation(@RequestBody LocationUpdateRequest request) {
    Trip trip = tripRepository.findById(request.getTripId())
        .orElseThrow(() -> new ResourceNotFoundException("Trip not found"));

    User currentUser = getCurrentUserFromJWT(); // Extract from JWT token

    // 1. Identify user type (Driver or Passenger)
    if (currentUser.getRole().equals(Role.DRIVER)) {
        // Update driver location
        trip.setDriverLatitude(request.getLatitude());
        trip.setDriverLongitude(request.getLongitude());
        trip.setDriverLocationTimestamp(System.currentTimeMillis());

        // 2. AUTO-DETECT PICKUP ARRIVAL (Critical logic)
        if (trip.getStatus().equals("ACCEPTED")) {
            double distanceToPickup = calculateDistance(
                trip.getDriverLatitude(), trip.getDriverLongitude(),
                trip.getPickupLatitude(), trip.getPickupLongitude()
            );

            if (distanceToPickup <= 50.0) { // 50 meters threshold
                trip.setStatus("ARRIVED");

                // Send notification to passenger
                notificationService.sendToPassenger(
                    trip.getUser().getId(),
                    "Driver Arrived",
                    "Your driver has arrived at the pickup location"
                );

                logger.info("Trip {} auto-transitioned to ARRIVED (distance: {}m)",
                    trip.getId(), distanceToPickup);
            }
        }
    } else if (currentUser.getRole().equals(Role.USER)) {
        // Update passenger location
        trip.setPassengerLatitude(request.getLatitude());
        trip.setPassengerLongitude(request.getLongitude());
        trip.setPassengerLocationTimestamp(System.currentTimeMillis());
    }

    tripRepository.save(trip);

    return ResponseEntity.ok(ApiResponse.success(
        "Location updated",
        new LocationUpdateResponse(trip)
    ));
}
```

**Helper Method - Distance Calculation:**

```java
private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    final int R = 6371000; // Earth's radius in meters
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);

    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
               Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
               Math.sin(dLon / 2) * Math.sin(dLon / 2);

    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}
```

---

### C. POST /api/v1/trips/start/{tripId}

**Method:** `POST`  
**Purpose:** Driver explicitly starts the trip when passenger boards  
**Params:** `tripId` (path parameter)  
**Auth:** Required (Driver only)  
**Priority:** HIGH

**Request Body:** Empty or with confirmation

```json
{}
```

**Response:**

```json
{
  "success": true,
  "message": "Trip started",
  "data": {
    "data": {
      "tripId": "0b620f59-1fd5-4d5f-84c2-9868c05b4b6d",
      "status": "ONGOING",
      "startedAt": "2026-02-08T01:35:00.000000Z"
    }
  }
}
```

**Backend Logic:**

```java
@PostMapping("/api/v1/trips/{tripId}/start")
public ResponseEntity<?> startTrip(@PathVariable String tripId) {
    Trip trip = tripRepository.findById(tripId)
        .orElseThrow(() -> new ResourceNotFoundException("Trip not found"));

    // 1. Verify driver is within 50m of pickup
    double distanceToPickup = calculateDistance(
        trip.getDriverLatitude(), trip.getDriverLongitude(),
        trip.getPickupLatitude(), trip.getPickupLongitude()
    );

    if (distanceToPickup > 50.0) {
        throw new IllegalStateException(
            "Driver must be within 50m of pickup location to start trip"
        );
    }

    // 2. Validate status
    if (!trip.getStatus().equals("ARRIVED")) {
        throw new IllegalStateException(
            "Trip must be in ARRIVED status to start"
        );
    }

    // 3. Update trip status
    trip.setStatus("ONGOING");
    trip.setUpdatedAt(LocalDateTime.now());
    tripRepository.save(trip);

    // 4. Send notification to passenger
    notificationService.sendToPassenger(
        trip.getUser().getId(),
        "Trip Started",
        "Your trip has started. Driver is on the way to destination."
    );

    return ResponseEntity.ok(ApiResponse.success("Trip started", trip));
}
```

---

### D. POST /api/v1/trips/complete/{tripId}

**Method:** `POST`  
**Purpose:** Driver marks trip complete at destination  
**Params:** `tripId` (path parameter)  
**Auth:** Required (Driver only)  
**Priority:** HIGH

**Request Body:**

```json
{
  "finalLatitude": 6.4253,
  "finalLongitude": 3.4041
}
```

**Response:**

```json
{
  "success": true,
  "message": "Trip completed",
  "data": {
    "data": {
      "tripId": "0b620f59-1fd5-4d5f-84c2-9868c05b4b6d",
      "status": "COMPLETED",
      "completedAt": "2026-02-08T01:45:30.000000Z",
      "finalFare": 13700.0
    }
  }
}
```

**Backend Logic:**

```java
@PostMapping("/api/v1/trips/{tripId}/complete")
public ResponseEntity<?> completeTrip(@PathVariable String tripId,
                                       @RequestBody TripCompleteRequest request) {
    Trip trip = tripRepository.findById(tripId)
        .orElseThrow(() -> new ResourceNotFoundException("Trip not found"));

    // 1. Validate status
    if (!trip.getStatus().equals("ONGOING")) {
        throw new IllegalStateException(
            "Only ONGOING trips can be completed"
        );
    }

    // 2. Update trip status
    trip.setStatus("COMPLETED");
    trip.setUpdatedAt(LocalDateTime.now());

    // 3. Calculate final fare (if dynamic pricing enabled)
    BigDecimal finalFare = calculateFinalFare(trip);
    trip.setPrice(finalFare);

    tripRepository.save(trip);

    // 4. Send notification to passenger
    notificationService.sendToPassenger(
        trip.getUser().getId(),
        "Trip Completed",
        String.format("Trip completed. Final fare: ₦%s", finalFare)
    );

    return ResponseEntity.ok(ApiResponse.success("Trip completed", trip));
}
```

---

## 3. Status Transition Logic

Implement a complete state machine for trip status:

### Valid Transitions

```
REQUESTED
    ↓
ACCEPTED (when driver accepts)
    ↓
ARRIVED (auto: driver within 50m, or manual: driver calls /start)
    ↓
ONGOING (when trip starts or location moves away from pickup)
    ↓
COMPLETED (when driver reaches destination)

Any state → CANCELLED (if either party cancels)
```

### Transition Rules

```java
public enum TripStatus {
    REQUESTED("Request posted, waiting for drivers"),
    ACCEPTED("Driver accepted, en route to pickup"),
    ARRIVED("Driver arrived at pickup location"),
    ONGOING("Trip in progress to destination"),
    COMPLETED("Trip completed successfully"),
    CANCELLED("Trip cancelled");

    private String description;

    // Validation logic for transitions
    public boolean canTransitionTo(TripStatus newStatus) {
        return switch (this) {
            case REQUESTED -> newStatus == ACCEPTED || newStatus == CANCELLED;
            case ACCEPTED -> newStatus == ARRIVED || newStatus == CANCELLED;
            case ARRIVED -> newStatus == ONGOING || newStatus == CANCELLED;
            case ONGOING -> newStatus == COMPLETED || newStatus == CANCELLED;
            case COMPLETED, CANCELLED -> false; // Terminal states
        };
    }
}
```

### Service Implementation

```java
@Service
public class TripStatusService {

    public void transitionStatus(Trip trip, TripStatus newStatus) {
        if (!trip.getStatus().canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                String.format("Cannot transition from %s to %s",
                    trip.getStatus(), newStatus)
            );
        }

        trip.setStatus(newStatus);
        trip.setUpdatedAt(LocalDateTime.now());

        // Log status change for analytics
        auditLog.log(trip.getId(), trip.getStatus().toString());

        // Trigger notifications
        notifyStatusChange(trip, newStatus);
    }
}
```

---

## 4. Location Update Endpoint Logic (Critical)

### Full Implementation Example

```java
@RestController
@RequestMapping("/api/v1/rides")
public class LocationController {

    private static final double PICKUP_ARRIVAL_THRESHOLD = 50.0; // meters
    private static final double DESTINATION_ARRIVAL_THRESHOLD = 50.0; // meters

    @PostMapping("/update-location")
    public ResponseEntity<?> updateLocation(
            @RequestBody LocationUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            // 1. Fetch trip
            Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found"));

            // 2. Get current user from JWT
            User currentUser = userRepository.findByUsername(userDetails.getUsername());

            // 3. Update location based on user role
            if (currentUser.getRole() == Role.DRIVER) {
                updateDriverLocation(trip, request, currentUser);
            } else if (currentUser.getRole() == Role.USER) {
                updatePassengerLocation(trip, request);
            }

            // 4. Save to database
            Trip updatedTrip = tripRepository.save(trip);

            // 5. Return response
            return ResponseEntity.ok(ApiResponse.success(
                "Location updated",
                new LocationUpdateResponse(updatedTrip)
            ));

        } catch (Exception e) {
            logger.error("Error updating location", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to update location"));
        }
    }

    private void updateDriverLocation(Trip trip, LocationUpdateRequest request, User driver) {
        // Update driver location
        trip.setDriverLatitude(request.getLatitude());
        trip.setDriverLongitude(request.getLongitude());
        trip.setDriverLocationTimestamp(System.currentTimeMillis());

        // Auto-detect pickup arrival
        if (trip.getStatus() == TripStatus.ACCEPTED) {
            double distanceToPickup = calculateDistance(
                trip.getDriverLatitude(), trip.getDriverLongitude(),
                trip.getPickupLatitude(), trip.getPickupLongitude()
            );

            if (distanceToPickup <= PICKUP_ARRIVAL_THRESHOLD) {
                trip.setStatus(TripStatus.ARRIVED);

                // Notify passenger
                sendNotification(
                    trip.getUser(),
                    "Driver Arrived",
                    "Your driver has arrived at pickup location"
                );

                logger.info("Trip {} - Driver arrived ({}m away)",
                    trip.getId(), distanceToPickup);
            }
        }
    }

    private void updatePassengerLocation(Trip trip, LocationUpdateRequest request) {
        // Update passenger location
        trip.setPassengerLatitude(request.getLatitude());
        trip.setPassengerLongitude(request.getLongitude());
        trip.setPassengerLocationTimestamp(System.currentTimeMillis());
    }

    private double calculateDistance(double lat1, double lon1,
                                     double lat2, double lon2) {
        final int R = 6371000; // meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) *
                   Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private void sendNotification(User user, String title, String message) {
        // Implement notification service (FCM, WebSocket, etc.)
        notificationService.send(user.getId(), title, message);
    }
}
```

---

## 5. Available Rides Endpoint

### GET /api/v1/trips/available

**Ensure endpoint returns:**

```json
{
  "success": true,
  "message": "Available rides fetched",
  "data": {
    "isSuccess": true,
    "status": "OK",
    "data": [
      {
        "id": "trip-001",
        "status": "REQUESTED",
        "fromLocation": "Pickup Address",
        "toLocation": "Destination Address",
        "pickupLatitude": 6.4311,
        "pickupLongitude": 3.4697,
        "dropOffLatitude": 6.4253,
        "dropOffLongitude": 3.4041,
        "distance": 5.5,
        "duration": "25",
        "initialFare": 2500.0,
        "price": 2500.0,
        "user": {
          "id": "user-123",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "phoneNumber": "08000000000"
        },
        "createdAt": "2026-02-08T01:20:00.000000Z"
      }
    ]
  }
}
```

**Query Logic:**

```java
@GetMapping("/available")
public ResponseEntity<?> getAvailableRides() {
    List<Trip> availableTrips = tripRepository.findByStatus("REQUESTED")
        .stream()
        .filter(trip -> {
            // Filter out trips older than 30 minutes
            return ChronoUnit.MINUTES.between(
                trip.getCreatedAt(),
                LocalDateTime.now()
            ) < 30;
        })
        .collect(Collectors.toList());

    return ResponseEntity.ok(ApiResponse.success(
        "Available rides fetched",
        availableTrips
    ));
}
```

---

## 6. Response Normalization

### Standard Response Format (All Endpoints)

**Success Response:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "isSuccess": true,
    "status": "OK",
    "message": "Operation successful",
    "data": {
      /* actual payload */
    }
  },
  "timestamp": "2026-02-08T01:35:00.000000Z"
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Operation failed",
  "data": {
    "isSuccess": false,
    "status": "ERROR",
    "message": "Detailed error message",
    "data": null
  },
  "timestamp": "2026-02-08T01:35:00.000000Z"
}
```

**Implementation:**

```java
@Component
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private NestedResponse<T> data;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(String message, T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.message = message;
        response.data = new NestedResponse<>(true, "OK", message, data);
        response.timestamp = LocalDateTime.now();
        return response;
    }

    public static <T> ApiResponse<T> error(String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = false;
        response.message = message;
        response.data = new NestedResponse<>(false, "ERROR", message, null);
        response.timestamp = LocalDateTime.now();
        return response;
    }
}
```

---

## 7. Database Indexes (Performance)

### Critical Indexes

```sql
-- Trip status lookups (frequent)
CREATE INDEX idx_trip_status ON trips(status);

-- Driver location updates (real-time)
CREATE INDEX idx_trip_driver_id ON trips(driver_id);

-- Passenger lookups
CREATE INDEX idx_trip_user_id ON trips(user_id);

-- Time-based queries
CREATE INDEX idx_trip_created_at ON trips(created_at DESC);

-- Combined query for available rides
CREATE INDEX idx_trip_status_created_at ON trips(status, created_at DESC);

-- Location proximity queries (if using PostGIS)
CREATE INDEX idx_trip_driver_location ON trips
  USING GIST (ll_to_earth(driver_latitude, driver_longitude));

CREATE INDEX idx_trip_pickup_location ON trips
  USING GIST (ll_to_earth(pickup_latitude, pickup_longitude));
```

### Hibernate Annotations

```java
@Entity
@Table(name = "trips",
    indexes = {
        @Index(name = "idx_trip_status", columnList = "status"),
        @Index(name = "idx_trip_driver_id", columnList = "driver_id"),
        @Index(name = "idx_trip_user_id", columnList = "user_id"),
        @Index(name = "idx_trip_created_at", columnList = "created_at DESC"),
        @Index(name = "idx_trip_status_created",
            columnList = "status, created_at DESC")
    }
)
public class Trip {
    // ... fields
}
```

---

## 8. Summary of Critical Backend Requirements

| Requirement                                          | Type           | Priority     | Status      |
| ---------------------------------------------------- | -------------- | ------------ | ----------- |
| Trip model location fields                           | Schema         | **CRITICAL** | ⛔ Not Done |
| `/api/v1/rides/update-location` with auto-transition | Endpoint       | **CRITICAL** | ⛔ Not Done |
| Location fields in trip responses                    | Schema + Logic | **CRITICAL** | ⛔ Not Done |
| Auto-calculate ARRIVED (50m detection)               | Business Logic | **CRITICAL** | ⛔ Not Done |
| Trip status state machine                            | Logic          | **HIGH**     | ⛔ Not Done |
| `/api/v1/trips/start/{tripId}`                       | Endpoint       | **HIGH**     | ⛔ Not Done |
| `/api/v1/trips/complete/{tripId}`                    | Endpoint       | **HIGH**     | ⛔ Not Done |
| Driver location sync in responses                    | Logic          | **HIGH**     | ⛔ Not Done |
| Passenger location sync (optional)                   | Logic          | **MEDIUM**   | ⛔ Not Done |
| Response normalization                               | Logic          | **HIGH**     | ✅ Done     |
| Database indexes                                     | Performance    | **MEDIUM**   | ⛔ Not Done |

---

## Implementation Checklist

- [ ] Add location fields to Trip entity
- [ ] Create database migration
- [ ] Add indexes to database
- [ ] Update `GET /api/v1/trips/{tripId}` response
- [ ] Implement location update endpoint with auto-detection
- [ ] Implement trip start endpoint
- [ ] Implement trip complete endpoint
- [ ] Implement status transition validation
- [ ] Add distance calculation utility
- [ ] Add notification service integration
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Deploy to staging
- [ ] Test with frontend

---

## Testing Scenarios

### Scenario 1: Pre-Pickup Navigation

1. Driver accepts trip (status = ACCEPTED)
2. Driver location updates via `/update-location` (3s intervals)
3. When driver within 50m: Auto-transition to ARRIVED
4. Frontend receives ARRIVED status and shows "Driver arrived"

### Scenario 2: Trip Start

1. Driver at pickup (status = ARRIVED)
2. Driver calls `POST /trips/start/{tripId}`
3. Backend validates driver is within 50m
4. Status transitions to ONGOING
5. Frontend switches to main trip route

### Scenario 3: Live Tracking During Trip

1. Trip status = ONGOING
2. Driver location updates continuously
3. Frontend recalculates route from driver's current location
4. ETA updates dynamically
5. Map polyline refreshes in real-time

### Scenario 4: Trip Completion

1. Driver reaches destination
2. Driver calls `POST /trips/complete/{tripId}`
3. Status transitions to COMPLETED
4. Both driver and passenger notified
5. Trip history updated

---

## Error Handling

**Frontend expects these errors:**

```json
{
  "success": false,
  "message": "Error message",
  "data": {
    "isSuccess": false,
    "status": "ERROR",
    "message": "Detailed error message"
  }
}
```

**Common Error Codes:**

- 404: Trip not found
- 400: Invalid status transition
- 403: User not authorized for trip
- 409: Driver not within pickup radius to start trip
- 500: Server error

---

## Notes

- All timestamps should be in UTC (ISO 8601 format)
- Distances should be in meters
- Coordinates should use WGS84 (latitude/longitude)
- Auto-transition to ARRIVED should happen automatically on location update
- Notifications should be sent via your notification service (FCM, WebSocket, etc.)
- Consider rate limiting on location updates to prevent abuse
- Log all status transitions for audit purposes

---

**Document Version:** 1.0  
**Last Updated:** February 8, 2026  
**Contact:** E4 Development Team
