import { io, Socket } from "socket.io-client";
import { TokenService } from "./token.service";

const SOCKET_URL = "http://localhost:8080";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, (...args: any[]) => void> = new Map();

  async connect(onConnect?: () => void, onError?: (err: any) => void) {
    if (this.socket?.connected) return;

    const token = await TokenService.getToken();

    this.socket = io(SOCKET_URL, {
      path: "/socket",
      transports: ["websocket"],
      auth: {
        token: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionDelay: 5000,
    });

    this.socket.on("connect", () => {
      console.log("Socket.IO Connected:", this.socket?.id);
      onConnect?.();
    });

    this.socket.on("connect_error", (err: any) => {
      console.error("Socket.IO Connection Error", err);
      onError?.(err);
    });

    this.socket.on("disconnect", (reason: any) => {
      console.log("Socket.IO Disconnected:", reason);
    });
  }

  /**
   * Listen to an event (replacement for STOMP subscribe)
   */
  subscribe(event: string, callback: (payload: any) => void) {
    if (!this.socket) {
      console.warn("Cannot subscribe. Socket not connected.");
      return;
    }

    const handler = (payload: any) => {
      callback(payload);
    };

    this.socket.on(event, handler);
    this.listeners.set(event, handler);
  }

  /**
   * Remove event listener
   */
  unsubscribe(event: string) {
    const handler = this.listeners.get(event);
    if (this.socket && handler) {
      this.socket.off(event, handler);
      this.listeners.delete(event);
    }
  }

  /**
   * Emit event (replacement for STOMP send)
   */
  send(event: string, payload: any) {
    if (!this.socket?.connected) {
      console.warn("Cannot send message. Socket not connected.");
      return;
    }

    this.socket.emit(event, payload);
  }

  disconnect() {
    if (this.socket) {
      this.listeners.forEach((handler, event) => {
        this.socket?.off(event, handler);
      });

      this.listeners.clear();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
