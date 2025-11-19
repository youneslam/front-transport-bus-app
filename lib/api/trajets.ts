// Trajets & Stations APIs - feature-scoped wrapper around the central api.ts

export type { Trajet, Station, CreateTrajetRequest } from "../api"

export {
  // Public trajets helpers
  fetchAllTrajets,
  fetchTrajetsByCity,
  fetchStationsForTrajet,

  // Admin trajets CRUD
  listTrajets,
  getTrajetById,
  listTrajetsByCity,
  getTrajetSchedules,
  createTrajet,
  updateTrajet,
  deleteTrajet,

  // Stations CRUD
  createStation,
  listStations,
  updateStation,
  deleteStation,
} from "../api"


