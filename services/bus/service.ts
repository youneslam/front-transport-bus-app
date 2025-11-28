/**
 * Bus Service
 * Handles all bus-related API operations
 */

import type { Bus, BusPayload } from "@/types/bus"

const BASE_URL = "/api/buses"

const jsonHeaders = {
  "Content-Type": "application/json",
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text()
    let message = "Une erreur est survenue."
    try {
      const parsed = JSON.parse(errorText)
      message = parsed.message || parsed.error || errorText || message
    } catch {
      message = errorText || message
    }
    throw new Error(message)
  }
  if (res.status === 204) {
    return {} as T
  }
  return (await res.json()) as T
}

const makeRequest = async <T>(path = "", init?: RequestInit): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
  })
  return handleResponse<T>(response)
}

export const BusService = {
  list: (): Promise<Bus[]> => makeRequest<Bus[]>(""),
  get: (id: number): Promise<Bus> => makeRequest<Bus>(`/${id}`),
  create: (payload: BusPayload): Promise<Bus> =>
    makeRequest<Bus>("", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: BusPayload): Promise<Bus> =>
    makeRequest<Bus>(`/${id}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    }),
  delete: (id: number): Promise<void> =>
    makeRequest<void>(`/${id}`, {
      method: "DELETE",
    }),
  simulate: (id: number): Promise<void> =>
    makeRequest<void>(`/${id}/simulate`, {
      method: "POST",
    }),
}

// Re-export types for convenience
export type { Bus, BusPayload, Bus as BusEntity } from "@/types/bus"

