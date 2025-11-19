import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface BusLocationPayload {
  busId: number;
  latitude: number;
  longitude: number;
  description?: string;
  [key: string]: unknown;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws";
const LOCATION_TOPIC = "/topic/bus-location";
const LOCATION_ENDPOINT = "/app/bus/location/send";

type Listener = (payload: BusLocationPayload) => void;

class SocketService {
  private client: Client | null = null;
  private listeners = new Set<Listener>();
  private connected = false;

  private initializeClient() {
    if (typeof window === "undefined") return;

    this.client = new Client({
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      webSocketFactory: () => new SockJS(WS_URL),
    });

    this.client.onConnect = () => {
      this.connected = true;
      console.log("WebSocket connecté ✅");

      // Souscription au topic correct
      this.client?.subscribe(LOCATION_TOPIC, (message: IMessage) => {
        try {
          const payload: BusLocationPayload = JSON.parse(message.body);
          this.listeners.forEach((listener) => listener(payload));
        } catch (error) {
          console.error("Erreur de parsing payload bus:", error);
        }
      });
    };

    this.client.onStompError = (frame) => {
      console.error("STOMP error:", frame.headers["message"], frame.body);
    };

    this.client.onWebSocketError = (event) => {
      console.error("WebSocket error:", event);
    };
  }

  connect() {
    if (this.connected || this.client?.active) return;
    this.initializeClient();
    this.client?.activate();
  }

  disconnect() {
    this.listeners.clear();
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
  }

  addListener(callback: Listener) {
    this.listeners.add(callback);
    this.connect();
    return () => {
      this.listeners.delete(callback);
    };
  }

  sendLocation(payload: BusLocationPayload) {
    if (!payload.busId || Number.isNaN(Number(payload.busId))) {
      throw new Error("Le busId est requis pour envoyer une position.");
    }
    this.connect();
    if (!this.client || !this.connected) {
      // Publish lorsque la connexion sera prête
      setTimeout(() => this.sendLocation(payload), 500);
      return;
    }
    this.client.publish({
      destination: LOCATION_ENDPOINT,
      body: JSON.stringify(payload),
    });
  }
}

export const socketService = new SocketService();
