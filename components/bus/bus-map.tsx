"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin, WifiOff } from "lucide-react"
import dynamic from "next/dynamic"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Card } from "@/components/ui/card"
import { BusEntity, BusService, busSocketService, BusLocationPayload } from "@/lib/api/buses"
import { useToast } from "@/hooks/use-toast"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })

const DEFAULT_CENTER: [number, number] = [33.5731, -7.5898]
const DEFAULT_ZOOM = 12

if (typeof window !== "undefined") {
  const icon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  })
  L.Marker.prototype.options.icon = icon
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
  const [buses, setBuses] = useState<BusEntity[]>([])
  const [positions, setPositions] = useState<Record<number, BusMarker>>({})
  const [status, setStatus] = useState<"connecting" | "online" | "offline">("connecting")

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
    const unsubscribe = busSocketService.addListener((payload: BusLocationPayload) => {
      setStatus("online")
      const { busId, latitude, longitude } = payload
      if (!busId || typeof latitude !== "number" || typeof longitude !== "number") return
      setPositions((prev) => ({
        ...prev,
        [busId]: {
          busId,
          latitude,
          longitude,
          updatedAt: Date.now(),
          label: buses.find((bus) => bus.id === busId)?.matricule,
        },
      }))
    })

    socketService.connect()
    const offlineTimer = setTimeout(() => {
      setStatus((current) => (current === "connecting" ? "offline" : current))
    }, 5000)

    return () => {
      clearTimeout(offlineTimer)
      unsubscribe()
      busSocketService.disconnect()
    }
  }, [buses])

  const markers = useMemo(() => Object.values(positions), [positions])

  const statusBadge = (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        status === "online" ? "bg-green-100 text-green-800" : status === "connecting" ? "bg-yellow-100 text-yellow-800" : "bg-destructive/20 text-destructive"
      }`}
    >
      {status === "online" ? "En direct" : status === "connecting" ? "Connexion..." : "Hors ligne"}
    </span>
  )

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <p className="text-sm uppercase font-semibold text-muted-foreground">Carte temps réel</p>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Bus en circulation
          </h2>
        </div>
        {statusBadge}
      </div>

      {typeof window === "undefined" ? (
        <div className="h-[480px] flex items-center justify-center text-muted-foreground">Initialisation de la carte...</div>
      ) : markers.length === 0 && status !== "online" ? (
        <div className="h-[480px] flex flex-col items-center justify-center text-muted-foreground gap-2">
          <WifiOff className="w-10 h-10" />
          <p>Aucun bus en ligne pour le moment.</p>
        </div>
      ) : (
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "480px", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((marker) => (
            <Marker key={marker.busId} position={[marker.latitude, marker.longitude]}>
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">Bus #{marker.busId}</p>
                  {marker.label && <p className="text-muted-foreground">{marker.label}</p>}
                  <p className="text-xs text-muted-foreground">
                    Dernière mise à jour: {new Date(marker.updatedAt).toLocaleTimeString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </Card>
  )
}

