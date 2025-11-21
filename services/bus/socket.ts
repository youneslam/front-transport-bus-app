/**
 * Bus Socket Service
 * Gère les connexions WebSocket pour le suivi en temps réel des bus
 * 
 * IMPORTANT: Ce service est en LECTURE SEULE (réception des mises à jour).
 * Pour envoyer une mise à jour de position, utilisez LocationService.updateLocation()
 * qui déclenchera automatiquement un broadcast WebSocket.
 */

import { Client, IMessage } from "@stomp/stompjs"
import type { BusLocationPayload } from "@/types/bus"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws"
const LOCATION_TOPIC = "/topic/bus-location"

type Listener = (payload: BusLocationPayload) => void

class BusSocketService {
  private client: Client | null = null
  private listeners = new Set<Listener>()
  private connected = false

  private async initializeClient() {
    if (typeof window === "undefined") return

    // Import dynamique de SockJS côté client uniquement
    const SockJS = (await import("sockjs-client")).default

    this.client = new Client({
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      webSocketFactory: () => new SockJS(WS_URL) as any,
    })

    this.client.onConnect = () => {
      this.connected = true
      console.log("WebSocket connecté ✅")

      // Souscription au topic correct
      this.client?.subscribe(LOCATION_TOPIC, (message: IMessage) => {
        try {
          const payload: BusLocationPayload = JSON.parse(message.body)
          this.listeners.forEach((listener) => listener(payload))
        } catch (error) {
          console.error("Erreur de parsing payload bus:", error)
        }
      })
    }

    this.client.onStompError = (frame) => {
      console.error("STOMP error:", frame.headers["message"], frame.body)
    }

    this.client.onWebSocketError = (event) => {
      console.error("WebSocket error:", event)
    }
  }

  async connect() {
    if (this.connected || this.client?.active) return
    await this.initializeClient()
    this.client?.activate()
  }

  disconnect() {
    this.listeners.clear()
    if (this.client) {
      this.client.deactivate()
      this.client = null
      this.connected = false
    }
  }

  /**
   * Ajoute un écouteur pour recevoir les mises à jour de position en temps réel
   * @param callback Fonction appelée à chaque mise à jour de position
   * @returns Fonction de nettoyage pour retirer l'écouteur
   */
  addListener(callback: Listener) {
    this.listeners.add(callback)
    this.connect()
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Obtient le statut de connexion WebSocket
   */
  isConnected(): boolean {
    return this.connected
  }
}

export const busSocketService = new BusSocketService()

// Legacy export for backward compatibility
export const socketService = busSocketService

// Re-export types
export type { BusLocationPayload } from "@/types/bus"
