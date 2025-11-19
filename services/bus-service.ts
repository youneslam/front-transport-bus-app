export interface Bus {
  id: number
  matricule: string
  description?: string
  trajetId: number
}

export interface BusPayload {
  matricule: string
  description: string
  trajetId: number
}

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
}

export type { Bus as BusEntity }

