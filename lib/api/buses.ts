/**
 * Bus API - feature-scoped wrapper
 * Provides convenient access to bus-related API operations
 */

export type { Bus, BusPayload, BusEntity, BusLocationPayload } from "@/types/bus"

export { BusService } from "@/services/bus/service"
export { busSocketService, socketService } from "@/services/bus/socket"

