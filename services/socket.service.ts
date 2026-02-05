import { io, Socket } from "socket.io-client";
import { TokenService } from "./token.service";

/**
 * Socket.IO Service for Real-Time Ride Management
 * Handles bidirectional communication with backend for:
 * - Ride requests and offers
 * - Trip status updates
 * - Real-time location tracking
 * - Error handling and reconnection
 */

export interface PriceOffer {
  id: string;
  trip: { id: string };
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    carName: string;
    brand: string;
    color: string;
    plateNumber: string;
    averageRating: number;
  };
  offeredPrice: number;
  accepted: boolean;
  createdAt: string;
}

export interface TripStatus {
  id: string;
  status:
    | "REQUESTED"
    | "ACCEPTED"
    | "ARRIVED"
    | "ONGOING"
    | "COMPLETED"
    | "CANCELLED";
  fromLocation: string;
  toLocation: string;
  distance: number;
  duration: string;
  price: number;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    carName: string;
    plateNumber: string;
    color: string;
    averageRating?: number;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  tripId: string;
  driverId: string;
}

/**
 * Socket Backend URL Configuration
 *
 * Development:
 * - Local Machine: http://<your-machine-ip>:9092 (RECOMMENDED)
 * - Dev Tunnel: https://1b67jdhr-9092.uks1.devtunnels.ms (slower, use as fallback)
 *
 * Production:
 * - https://api.e4ride.com:9092 (with WSS)
 */
const SOCKET_URLS = {
  // IMPORTANT: Use your machine IP for faster, more reliable connection
  // Example: "http://192.168.0.186:9092"
  // Find your IP: Run 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
  development: "http://192.168.0.186:9092", // ✅ CHANGE THIS TO YOUR MACHINE IP

  // Dev tunnel - slower but works across networks
  devTunnel: "https://1b67jdhr-9092.uks1.devtunnels.ms",

  // For production
  production: "https://api.e4ride.com:9092",
};

class SocketService {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Get the appropriate Socket.IO server URL based on environment
   * Prioritizes local network for reliability and speed
   */
  private getSocketUrl(): string {
    const isProduction = false; // Set to true in production builds

    if (isProduction) {
      return SOCKET_URLS.production;
    }

    // Always use local machine IP for development - it's faster and more reliable
    // The machine IP (192.168.0.186) should be running the backend on port 9092
    return SOCKET_URLS.development;
  }

  /**
   * Establishes connection to Socket.IO server with JWT authentication
   * Handles both WebSocket and polling transports with proper error handling
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log("✅ Socket already connected");
      return;
    }

    let token = await TokenService.getToken();
    if (!token) {
      const errorMsg = "JWT token missing - please login first";
      console.error("❌ " + errorMsg);
      throw new Error(errorMsg);
    }

    // Debug: Log token (sanitized for security)
    const tokenPreview = token.substring(0, 20) + "...";
    console.log(`🔐 Using token: ${tokenPreview}`);
    console.log(`📝 Token length: ${token.length} characters`);

    return new Promise((resolve, reject) => {
      const socketUrl = this.getSocketUrl();
      console.log(`🔗 Attempting connection to: ${socketUrl}`);

      // Socket.IO configuration with fallback transports
      this.socket = io(socketUrl, {
        auth: {
          token, // ✅ JWT token for authentication
        },
        // Try WebSocket first, fallback to polling if WebSocket fails
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 2000, // Start with 2 seconds
        reconnectionDelayMax: 10000, // Cap at 10 seconds
        reconnectionAttempts: 10, // Try up to 10 times
        // Additional options for stability
        forceNew: false, // Reuse existing connections
        autoConnect: true, // Auto-connect when socket created
        upgrade: true, // Allow upgrading from polling to WebSocket
        // Timeout settings
        ackTimeout: 60000, // Increase ack timeout to 60 seconds
        // For secure connections (https/wss)
        rejectUnauthorized: false, // Allow self-signed certificates (dev only)
      });

      // ============= CONNECTION EVENTS =============

      // Set a timeout for initial connection
      this.connectionTimeout = setTimeout(() => {
        if (!this.socket?.connected) {
          const errorMsg =
            "⏱️ Connection timeout - Backend may not be running or unreachable\n" +
            `URL: ${socketUrl}\n\n` +
            "Common fixes:\n" +
            "1. ✅ Make sure your machine IP is correct (currently: 192.168.0.186:9092)\n" +
            "   Run 'ipconfig' to find your IP address\n" +
            "2. ✅ Verify backend is running on port 9092\n" +
            "3. ✅ Check firewall allows port 9092\n" +
            "4. ✅ Ensure frontend and backend are on same network";

          console.error(errorMsg);
          this.socket?.disconnect();
          reject(new Error(errorMsg));
        }
      }, 20000); // 20 second timeout (increased from 10s)

      this.socket.on("connect", () => {
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
        console.log("✅ Socket.IO Connected successfully");
        console.log("📍 Session ID:", this.socket?.id);
        console.log(
          "📊 Using transport:",
          this.socket?.io?.engine?.transport?.name,
        );
        this.emit("internal-connect-success", {});
        resolve();
      });

      this.socket.on("connect_error", (error: any) => {
        const errorMsg = error?.message || String(error);
        console.error("❌ Connection Error:", errorMsg);

        // Provide diagnostic information
        const diagnostics = [
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          "🔍 SOCKET.IO CONNECTION FAILED",
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          `Error: ${errorMsg}`,
          "",
          "Possible causes:",
          "  1. 🔐 Missing/invalid JWT token in auth",
          "  2. ⏱️  Token expired - re-login required",
          "  3. 🌐 Backend not running on " + socketUrl,
          "  4. 🔌 Firewall blocking port 9092",
          "  5. ❌ Network connectivity issue",
          "",
          "Debug info:",
          `  Socket URL: ${socketUrl}`,
          `  Token sent: Yes (${token.length} chars)`,
          "",
          "Next steps:",
          "  • Check backend logs for auth errors",
          "  • Verify token is not expired",
          "  • Check network connectivity",
        ];

        console.error(diagnostics.join("\n"));

        if (
          errorMsg.includes("token") ||
          errorMsg.includes("auth") ||
          errorMsg.includes("401") ||
          errorMsg.includes("Unauthorized")
        ) {
          console.error("🔐 AUTH FAILED - Token validation failed on backend");
          console.error(
            "   Check backend SocketIOConfig for token validation logic",
          );
        } else if (
          errorMsg.includes("websocket") ||
          errorMsg.includes("ECONNREFUSED")
        ) {
          console.warn(
            "⚠️ WebSocket failed - Attempting fallback to polling...",
          );
          // Don't reject here, let it retry with polling
        } else {
          reject(error);
        }
      });

      // Handle WebSocket-specific errors
      this.socket.io.on("error", (error: any) => {
        console.error("⚠️ Transport Error:", error?.message || error);
      });

      this.socket.on("disconnect", (reason: string) => {
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
        console.log("🔴 Socket disconnected");
        console.log(`   Reason: ${reason}`);
        this.emit("internal-disconnect", { reason });
      });

      this.socket.on("reconnect_attempt", () => {
        console.log("🔄 Attempting to reconnect...");
        this.emit("internal-reconnect-attempt", {});
      });

      this.socket.on("reconnect", () => {
        console.log("✅ Reconnected to server");
        this.emit("internal-reconnected", {});
      });

      this.socket.on("reconnect_failed", () => {
        console.error("❌ Failed to reconnect after all attempts");
        console.error(
          "   Please check if backend is running and network is available",
        );
        this.emit("internal-reconnect-failed", {});
      });
    });
  }

  /**
   * Listen for WebSocket events from server
   * Supports multiple listeners per event
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());

      // Register listener with socket only once per event
      this.socket?.on(event, (data: any) => {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
          listeners.forEach((listener) => listener(data));
        }
      });
    }

    this.eventListeners.get(event)?.add(callback);
  }

  /**
   * Emit event to server with optional callback (acknowledgment)
   */
  emit(event: string, data: any, callback?: (response: any) => void): void {
    if (!this.socket?.connected && !event.startsWith("internal-")) {
      console.warn(`⚠️ Socket not connected. Cannot emit "${event}"`);
      return;
    }

    if (callback) {
      this.socket?.emit(event, data, callback);
    } else {
      this.socket?.emit(event, data);
    }
  }

  /**
   * Remove listener for specific event
   */
  off(event: string, callback?: (data: any) => void): void {
    if (callback) {
      this.eventListeners.get(event)?.delete(callback);
    } else {
      this.eventListeners.delete(event);
      this.socket?.off(event);
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.eventListeners.clear();
    console.log("🛑 Socket disconnected");
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  /**
   * Force reconnection (useful after network recovery)
   */
  reconnect(): void {
    if (this.socket?.disconnected) {
      this.socket.connect();
    }
  }

  /**
   * Get current socket ID (useful for debugging)
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // ============= RIDE REQUEST EVENTS =============

  /**
   * Listen for new ride requests (Driver only)
   * Emitted by: Server (broadcast to all drivers)
   * Payload: Trip object with user info and pickup/dropoff details
   */
  onRideRequest(callback: (trip: any) => void): void {
    this.on("ride-request", callback);
  }

  // ============= PRICE OFFER EVENTS =============

  /**
   * Listen for price offers from drivers (Passenger only)
   * Emitted by: Server (to passenger)
   * Payload: PriceOffer object with driver details
   */
  onPriceOffer(callback: (offer: PriceOffer) => void): void {
    this.on("price-offer", callback);
  }

  /**
   * Driver proposes price for a trip
   * Emitted by: Driver client
   * Payload: { tripId: string, offeredPrice: number }
   * Callback: (response: { success: boolean, message?: string }) => void
   */
  proposePriceForTrip(
    tripId: string,
    offeredPrice: number,
    callback?: (response: any) => void,
  ): void {
    this.emit("propose-price", { tripId, offeredPrice }, callback);
  }

  // ============= TRIP STATUS EVENTS =============

  /**
   * Listen for trip status updates
   * Emitted by: Server (to both driver and passenger)
   * Payload: TripStatus object with current trip state
   * Status progression: REQUESTED → ACCEPTED → ARRIVED → ONGOING → COMPLETED
   */
  onTripStatusUpdate(callback: (trip: TripStatus) => void): void {
    this.on("trip-status", callback);
  }

  /**
   * Listen for trip taken notification (Driver only)
   * Emitted by: Server (broadcast to all other drivers)
   * Payload: Trip ID (string)
   * Purpose: Notify drivers that a trip was accepted by another driver
   */
  onTripTaken(callback: (tripId: string) => void): void {
    this.on("trip-taken", callback);
  }

  // ============= LOCATION TRACKING EVENTS =============

  /**
   * Driver sends location update to server
   * Emitted by: Driver client (every 2-5 seconds during active trip)
   * Payload: { latitude: number, longitude: number, tripId: string }
   * Frequency: Should be throttled to avoid excessive API calls
   */
  emitLocationUpdate(
    latitude: number,
    longitude: number,
    tripId: string,
  ): void {
    this.emit("update-location", {
      latitude,
      longitude,
      tripId,
    });
  }

  /**
   * Listen for driver location updates (Passenger only)
   * Emitted by: Server (to passenger)
   * Payload: LocationUpdate object with driver coordinates
   * Frequency: Updates every few seconds
   */
  onLocationUpdate(callback: (location: LocationUpdate) => void): void {
    this.on("location-update", callback);
  }

  // ============= ERROR HANDLING =============

  /**
   * Handle socket errors
   */
  onError(callback: (error: any) => void): void {
    this.socket?.on("error", callback);
  }

  /**
   * Emit with retry mechanism for critical operations
   */
  emitWithRetry(
    event: string,
    data: any,
    maxAttempts: number = 3,
    delayMs: number = 2000,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const attemptEmit = () => {
        attempts++;
        this.emit(event, data, (response: any) => {
          if (response?.success) {
            resolve(response);
          } else if (attempts < maxAttempts) {
            console.warn(
              `⚠️ Retry ${attempts}/${maxAttempts} for event: ${event}`,
            );
            setTimeout(attemptEmit, delayMs);
          } else {
            reject(
              new Error(
                `Failed to emit "${event}" after ${maxAttempts} attempts`,
              ),
            );
          }
        });
      };

      attemptEmit();
    });
  }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;
