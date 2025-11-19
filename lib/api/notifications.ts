// Notifications API helpers

const API_BASE_URL = "/api"

export interface Notification {
  id: number
  achatId: number
  userId: number
  userName: string
  ticketId: number
  ticketDescription?: string | null
  trajetId: number
  nomTrajet: string
  cityName: string
  priceInDhs: number
  achatCreatedAt: string
}

export interface AbonnementNotification {
  id: number
  userId: number
  userName: string
  cityId?: number
  cityName?: string
  type?: string
  priceInDhs?: number
  createdAt?: string
  message?: string
}

async function handleJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!res.ok) {
    let message = text || `HTTP ${res.status}`
    try {
      const parsed = JSON.parse(text)
      message = parsed.message || parsed.error || message
    } catch {
      // ignore
    }
    throw new Error(message)
  }
  return text ? (JSON.parse(text) as T) : ({} as T)
}

export async function listNotifications(): Promise<Notification[]> {
  const res = await fetch(`${API_BASE_URL}/notifications`, {
    method: "GET",
  })
  try {
    const data = await handleJsonResponse<Notification[]>(res)
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error("Erreur lors de la récupération des notifications:", err)
    return []
  }
}

export async function listAbonnementNotifications(): Promise<AbonnementNotification[]> {
  const res = await fetch(`${API_BASE_URL}/abonnement-notifications`, {
    method: "GET",
  })
  try {
    const data = await handleJsonResponse<AbonnementNotification[]>(res)
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error("Erreur lors de la récupération des notifications d'abonnement:", err)
    return []
  }
}


