/**
 * Bus Location Service
 * Gère les opérations de géolocalisation via REST API
 * Pour les mises à jour en temps réel, utilisez busSocketService
 */

import type { LocationDTO, LocationData } from "@/types/bus"

const BASE_URL = "/api/location"

const jsonHeaders = {
    "Content-Type": "application/json",
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const errorText = await res.text()
        let message = "Erreur lors de l'opération de localisation."
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

    // Gérer les réponses texte (comme "Location saved") et JSON
    const contentType = res.headers.get("content-type")
    if (contentType?.includes("application/json")) {
        return (await res.json()) as T
    } else {
        // Réponse texte brut
        return (await res.text()) as T
    }
}

const makeRequest = async <T>(path = "", init?: RequestInit): Promise<T> => {
    const response = await fetch(`${BASE_URL}${path}`, {
        cache: "no-store",
        ...init,
    })
    return handleResponse<T>(response)
}

export const LocationService = {
    /**
     * Met à jour la position d'un bus
     * Endpoint: POST /api/location/update (selon BusLocationController)
     * Sauvegarde dans PostgreSQL (historique) + Redis (cache)
     * Déclenche un broadcast WebSocket vers /topic/bus-location
     */
    updateLocation: (location: LocationDTO): Promise<string> =>
        makeRequest<string>("/update", {
            method: "POST",
            headers: jsonHeaders,
            body: JSON.stringify(location),
        }),

    /**
     * Récupère la dernière position connue d'un bus depuis Redis
     * Endpoint: GET /api/location/latest/{busId} (selon BusLocationController)
     */
    getLatestLocation: (busId: number): Promise<LocationData | null> =>
        makeRequest<LocationData | null>(`/latest/${busId}`).catch(() => null),
}

// Re-export types for convenience
export type { LocationDTO, LocationData } from "@/types/bus"
