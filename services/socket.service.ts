import { io, Socket } from "socket.io-client";
import { TokenService } from "./token.service";

class SocketService {
  private socket: Socket | null = null;

  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    const token = await TokenService.getToken();
    if (!token) throw new Error("JWT token missing");

    return new Promise((resolve, reject) => {
      this.socket = io("https://1b67jdhr-8080.uks1.devtunnels.ms", {
        transports: ["polling", "websocket"],
        auth: {
          token, // ✅ RAW JWT ONLY
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
      });

      this.socket.on("connect", () => {
        console.log("Socket.IO Connected:", this.socket?.id);
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket.IO Connection Error:", error);
        reject(error);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("Socket.IO Disconnected:", reason);
      });
    });
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  emit(event: string, data: any) {
    if (!this.socket?.connected) return;
    this.socket.emit(event, data);
  }

  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }
}

export default new SocketService();
