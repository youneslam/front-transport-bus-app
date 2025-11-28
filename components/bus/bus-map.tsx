"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin, WifiOff, Search, Navigation, Bus as BusIcon } from "lucide-react"
import dynamic from "next/dynamic"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Card } from "@/components/ui/card"
import { Bus, BusService, busSocketService, BusLocationPayload } from "@/services/bus"
import { fetchStationsForTrajet, Station } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false })
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false })
const MapViewControl = dynamic(() => import("./map-view-control"), { ssr: false })

const DEFAULT_CENTER: [number, number] = [36.8065, 10.1815] // Tunis
const DEFAULT_ZOOM = 12

if (typeof window !== "undefined") {
  // Fix leaflet icons
  const L = require("leaflet")
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
}

interface BusMarker {
  busId: number
  latitude: number
  longitude: number
  updatedAt: number
  label?: string
}

export function BusMap() {
  const { toast } = useToast()
  const [buses, setBuses] = useState<Bus[]>([])
  const [positions, setPositions] = useState<Record<number, BusMarker>>({})
  const [status, setStatus] = useState<"connecting" | "online" | "offline">("connecting")

  // Recherche et Navigation
  const [searchTerm, setSearchTerm] = useState("")
  const [viewState, setViewState] = useState<{ center: [number, number]; zoom: number }>({
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM
  })
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null)
  const [routePath, setRoutePath] = useState<[number, number][]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [simulating, setSimulating] = useState(false)

  useEffect(() => {
    BusService.list()
      .then(setBuses)
      .catch((error) =>
        toast({
          title: "Erreur bus",
          description: error instanceof Error ? error.message : "Impossible de charger les bus.",
          variant: "destructive",
        }),
      )
  }, [toast])

  useEffect(() => {
    // S'abonner aux mises à jour (gère la connexion automatiquement)
    const unsubscribe = busSocketService.addListener((payload: BusLocationPayload) => {
      setStatus("online")
      const { busId, latitude, longitude } = payload

      // Validation basique
      if (!busId || typeof latitude !== "number" || typeof longitude !== "number") return

      setPositions((prev) => ({
        ...prev,
        [busId]: {
          busId,
          latitude,
          longitude,
          updatedAt: Date.now(),
          label: buses.find((bus) => bus.id === busId)?.matricule || `Bus ${busId}`,
        },
      }))
    })

    // Vérifier le statut périodiquement
    const statusInterval = setInterval(() => {
      setStatus(busSocketService.isConnected() ? "online" : "connecting")
    }, 2000)

    return () => {
      clearInterval(statusInterval)
      unsubscribe()
    }
  }, [buses])

  // Filtrer les bus
  const filteredBuses = useMemo(() => {
    return buses.filter(bus =>
      bus.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.id.toString().includes(searchTerm)
    )
  }, [buses, searchTerm])

  // Fetch route and stations when bus is selected
  useEffect(() => {
    if (!selectedBusId) {
      setRoutePath([])
      setStations([])
      return
    }

    const bus = buses.find(b => b.id === selectedBusId)
    if (!bus || !bus.trajetId) return

    fetchStationsForTrajet(bus.trajetId)
      .then(data => {
        const sorted = data.sort((a, b) => (a.ordreDansTrajet || 0) - (b.ordreDansTrajet || 0))
        // Filter stations to only those with valid coordinates to ensure 1:1 mapping with routePath
        const validStations = sorted.filter(s => s.latitude && s.longitude)
        setStations(validStations)

        const path = validStations.map(s => [s.latitude!, s.longitude!] as [number, number])
        setRoutePath(path)

        // If bus is selected but has no position, set it to the first station
        if (path.length > 0 && !positions[selectedBusId]) {
          const startPos = path[0]
          setPositions(prev => ({
            ...prev,
            [selectedBusId]: {
              busId: selectedBusId,
              latitude: startPos[0],
              longitude: startPos[1],
              updatedAt: Date.now(),
              label: bus.matricule
            }
          }))
          setViewState({
            center: startPos,
            zoom: 16
          })
        }
      })
      .catch(console.error)
  }, [selectedBusId, buses])

  const handleStartSimulation = (e: React.MouseEvent, busId: number) => {
    e.stopPropagation()
    if (routePath.length < 2 || stations.length < 2) {
      toast({
        title: "Erreur",
        description: "Trajet insuffisant pour la simulation",
        variant: "destructive"
      })
      return
    }

    setSimulating(true)
    toast({
      title: "Simulation démarrée",
      description: "Simulation en temps réel (1 minute estimée = 1 minute réelle).",
    })

    // Calculate segments with duration based on estimatedMinutes
    // Scale: 1 estimated minute = 60000ms (1 minute) in simulation (Real-time)
    const TIME_SCALE = 60000
    const DEFAULT_SEGMENT_DURATION = 60000 // Fallback to 1 minute if no time diff

    const segments = []
    let currentStartTime = 0

    for (let i = 0; i < stations.length - 1; i++) {
      const startStation = stations[i]
      const endStation = stations[i + 1]

      let minutesDiff = (endStation.estimatedMinutes || 0) - (startStation.estimatedMinutes || 0)
      // Handle negative or zero diff (e.g. data error or same time)
      if (minutesDiff <= 0) minutesDiff = 0

      // If minutesDiff is 0, use fallback, otherwise scale it
      const duration = minutesDiff > 0 ? minutesDiff * TIME_SCALE : DEFAULT_SEGMENT_DURATION

      segments.push({
        index: i,
        start: routePath[i],
        end: routePath[i + 1],
        startTime: currentStartTime,
        duration: duration
      })

      currentStartTime += duration
    }

    const totalDuration = currentStartTime
    let animationStartTime: number | null = null

    const animate = (timestamp: number) => {
      if (!animationStartTime) animationStartTime = timestamp
      const elapsed = timestamp - animationStartTime

      if (elapsed >= totalDuration) {
        setSimulating(false)
        toast({ title: "Simulation terminée" })
        return
      }

      // Find current segment
      const currentSegment = segments.find(seg =>
        elapsed >= seg.startTime && elapsed < (seg.startTime + seg.duration)
      ) || segments[segments.length - 1]

      if (currentSegment) {
        const segmentElapsed = elapsed - currentSegment.startTime
        const progress = Math.min(segmentElapsed / currentSegment.duration, 1)

        const lat = currentSegment.start[0] + (currentSegment.end[0] - currentSegment.start[0]) * progress
        const lng = currentSegment.start[1] + (currentSegment.end[1] - currentSegment.start[1]) * progress

        setPositions(prev => ({
          ...prev,
          [busId]: {
            ...prev[busId],
            latitude: lat,
            longitude: lng,
            updatedAt: Date.now()
          }
        }))
      }

      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }

  const handleSelectBus = (busId: number) => {
    setSelectedBusId(busId)
    const pos = positions[busId]
    if (pos) {
      setViewState({
        center: [pos.latitude, pos.longitude],
        zoom: 16
      })
    }
  }

  const markers = useMemo(() => Object.values(positions), [positions])

  const createBusIcon = () => {
    return L.divIcon({
      className: 'custom-bus-marker',
      html: `<div style="background-color: #3b82f6; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <span style="font-size: 20px;">🚌</span>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    })
  }

  const statusBadge = (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${status === "online" ? "bg-green-100 text-green-800" : status === "connecting" ? "bg-yellow-100 text-yellow-800" : "bg-destructive/20 text-destructive"
        }`}
    >
      {status === "online" ? "En direct" : status === "connecting" ? "Connexion..." : "Hors ligne"}
    </span>
  )

  return (
    <Card className="p-0 overflow-hidden relative h-[600px] flex flex-col md:flex-row">
      {/* Sidebar de recherche (Overlay sur mobile, Sidebar sur desktop) */}
      <div className="absolute md:relative z-[400] md:z-0 top-4 left-4 right-4 md:top-0 md:left-0 md:right-0 md:w-80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:bg-background shadow-xl md:shadow-none md:border-r border-border rounded-lg md:rounded-none flex flex-col max-h-[40%] md:max-h-full transition-all">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between md:hidden">
            <h3 className="font-semibold flex items-center gap-2">
              <BusIcon className="w-4 h-4" /> Bus ({filteredBuses.length})
            </h3>
            {statusBadge}
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher (Matricule, ID...)"
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredBuses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucun bus trouvé
              </div>
            ) : (
              filteredBuses.map(bus => {
                const isOnline = !!positions[bus.id]
                const isSelected = selectedBusId === bus.id

                return (
                  <div key={bus.id} className="space-y-2">
                    <button
                      onClick={() => handleSelectBus(bus.id)}
                      className={`w-full text-left p-3 rounded-md transition-colors flex items-center justify-between group ${isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        }`}
                    >
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          {bus.matricule}
                          {!isOnline && <Badge variant="outline" className="text-[10px] h-4 px-1">Hors ligne</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {bus.description || "Pas de description"}
                        </div>
                      </div>
                      {isOnline && (
                        <Navigation className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`} />
                      )}
                    </button>

                    {isSelected && (
                      <div className="px-2 pb-2">
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={(e) => handleStartSimulation(e, bus.id)}
                          disabled={simulating}
                        >
                          {simulating ? "Simulation en cours..." : "▶ Démarrer Simulation"}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Carte */}
      <div className="flex-1 relative h-full">
        {/* Status Badge (Desktop only) */}
        <div className="absolute top-4 right-4 z-[400] hidden md:block bg-background/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border">
          {statusBadge}
        </div>

        {typeof window === "undefined" ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">Initialisation...</div>
        ) : (
          // @ts-ignore
          <MapContainer
            key={`${DEFAULT_CENTER[0]}-${DEFAULT_CENTER[1]}`}
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            zoomControl={false} // On déplace le zoom control si besoin
          >
            <MapViewControl center={viewState.center} zoom={viewState.zoom} />

            {/* @ts-ignore */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* @ts-ignore */}
            {routePath.length > 0 && <Polyline positions={routePath} color="#3b82f6" weight={4} opacity={0.7} />}

            {/* Draw Stations */}
            {stations.map(station => (
              station.latitude && station.longitude && (
                // @ts-ignore
                <CircleMarker
                  key={`station-${station.id}`}
                  center={[station.latitude, station.longitude]}
                  radius={6}
                  fillColor="white"
                  color="#3b82f6"
                  weight={2}
                  opacity={1}
                  fillOpacity={1}
                >
                  {/* @ts-ignore */}
                  <Popup>
                    <div style={{ fontFamily: 'sans-serif', fontSize: '12px' }}>
                      <strong>{station.nom || station.stationName}</strong>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            ))}

            {markers.map((marker) => (
              // @ts-ignore
              <Marker
                key={marker.busId}
                position={[marker.latitude, marker.longitude]}
                icon={createBusIcon()}
                eventHandlers={{
                  click: () => {
                    setSelectedBusId(marker.busId)
                    setViewState({ center: [marker.latitude, marker.longitude], zoom: 16 })
                  }
                }}
              >
                {/* @ts-ignore */}
                <Popup>
                  <div className="space-y-1 text-sm min-w-[150px]">
                    <p className="font-semibold flex items-center gap-2">
                      Bus {marker.label}
                      <Badge variant="default" className="h-4 px-1 text-[10px] bg-green-500">En ligne</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dernière MAJ: {new Date(marker.updatedAt).toLocaleTimeString()}
                    </p>
                    <div className="mt-2 pt-2 border-t">
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs"
                        onClick={(e) => handleStartSimulation(e, marker.busId)}
                        disabled={simulating}
                      >
                        {simulating ? "Simulation en cours..." : "▶ Démarrer Simulation"}
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </Card>
  )
}
