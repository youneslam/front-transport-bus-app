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

// Alias for backward compatibility
export type BusEntity = Bus

