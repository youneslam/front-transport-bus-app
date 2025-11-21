/**
 * Bus Services Barrel Export
 * Point d'entrée centralisé pour tous les services bus
 */

// Services
export { BusService } from "./service"
export { LocationService } from "./location-service"
export { busSocketService, socketService } from "./socket"

// Types
export type {
    Bus,
    BusPayload,
    BusEntity,
    BusLocationPayload,
    LocationDTO,
    LocationData,
} from "@/types/bus"
