import { HOST } from "@/security/api-secured";
import { Client, IMessage } from "@stomp/stompjs";
import "text-encoding-polyfill"; // Required for StompJS on React Native
import { TokenService } from "./token.service";

const SOCKET_URL = `ws://${HOST}/ws`;

class SocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, any> = new Map();

  async connect(onConnect?: () => void, onError?: (err: any) => void) {
    if (this.client?.connected) return;

    const token = await TokenService.getToken();

    this.client = new Client({
      brokerURL: SOCKET_URL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log("STOMP: " + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log("STOMP Connected");
        if (onConnect) onConnect();
      },
      onStompError: (frame) => {
        console.error("STOMP Error", frame);
        if (onError) onError(frame);
      },
      onWebSocketClose: () => {
        console.log("WebSocket connection closed");
      },
    });

    this.client.activate();
  }

  subscribe(topic: string, callback: (payload: any) => void) {
    if (!this.client || !this.client.connected) {
      console.warn("Cannot subscribe. Client not connected.");
      return;
    }

    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      const payload = JSON.parse(message.body);
      callback(payload);
    });

    this.subscriptions.set(topic, subscription);
    return subscription;
  }

  unsubscribe(topic: string) {
    const subscription = this.subscriptions.get(topic);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
    }
  }

  send(destination: string, body: any) {
    if (!this.client || !this.client.connected) {
      console.warn("Cannot send message. Client not connected.");
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.subscriptions.clear();
    }
  }
}

export default new SocketService();
