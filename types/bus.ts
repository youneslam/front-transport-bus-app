/**
 * Bus-related types and interfaces
 * Centralized type definitions for bus entities and operations
 */

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

export interface BusLocationPayload {
  busId: number
  latitude: number
  longitude: number
  description?: string
  [key: string]: unknown
}

/**
 * Location DTO - Correspond au LocationDTO du backend Spring Boot
 * Utilisé pour les appels API REST de mise à jour de position
 */
export interface LocationDTO {
  busId: number
  latitude: number
  longitude: number
  timestamp: number // Timestamp en millisecondes
}

/**
 * Location Data - Réponse complète du backend incluant l'ID
 */
export interface LocationData extends LocationDTO {
  id?: number
}

// Alias for backward compatibility
export type BusEntity = Bus

