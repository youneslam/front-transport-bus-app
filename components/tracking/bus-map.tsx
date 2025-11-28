"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "./bus-map.css"
import type { Bus, BusLocationPayload } from "@/services/bus"
import { BusService } from "@/services/bus"
import { fetchStationsForTrajet } from "@/lib/api"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false })
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false })

// Fix pour les icônes Leaflet dans Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface BusMapProps {
    buses: Bus[]
    positions: Map<number, BusLocationPayload>
    selectedBusId: number | null
    onBusSelect: (busId: number) => void
}

export default function BusMap({ buses, positions, selectedBusId, onBusSelect }: BusMapProps) {
    const mapRef = useRef<L.Map | null>(null)
    const markersRef = useRef<Map<number, L.Marker>>(new Map())
    const routeLayerRef = useRef<L.LayerGroup | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const { toast } = useToast()

    const [routePath, setRoutePath] = useState<[number, number][]>([])
    const [stations, setStations] = useState<any[]>([])
    const [simulating, setSimulating] = useState(false)

    // Initialiser la carte
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return

        // Créer la carte centrée sur Tunis (ou votre ville)
        const map = L.map(containerRef.current).setView([36.8065, 10.1815], 13)

        // Ajouter les tuiles OpenStreetMap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map)

        // Layer group for route elements
        const routeLayer = L.layerGroup().addTo(map)
        routeLayerRef.current = routeLayer

        mapRef.current = map

        return () => {
            map.remove()
            mapRef.current = null
        }
    }, [])

    // Render Route and Stations
    useEffect(() => {
        if (!routeLayerRef.current) return

        const layerGroup = routeLayerRef.current
        layerGroup.clearLayers()

        if (routePath.length > 0) {
            // Draw Polyline
            L.polyline(routePath, {
                color: '#3b82f6',
                weight: 4,
                opacity: 0.7,
                dashArray: '10, 10',
                lineCap: 'round'
            }).addTo(layerGroup)

            // Draw Stations
            stations.forEach(station => {
                if (station.latitude && station.longitude) {
                    const circle = L.circleMarker([station.latitude, station.longitude], {
                        radius: 6,
                        fillColor: 'white',
                        color: '#3b82f6',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 1
                    }).addTo(layerGroup)

                    circle.bindPopup(`
                        <div style="font-family: sans-serif; font-size: 12px;">
                            <strong>${station.nom || station.stationName}</strong>
                        </div>
                    `)
                }
            })
        }
    }, [routePath, stations])

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
                setStations(sorted)
                const path = sorted
                    .filter(s => s.latitude && s.longitude)
                    .map(s => [s.latitude!, s.longitude!] as [number, number])
                setRoutePath(path)
            })
            .catch(console.error)
    }, [selectedBusId, buses])

    const handleStartSimulation = async (e: React.MouseEvent, busId: number) => {
        e.stopPropagation()
        setSimulating(true)
        try {
            await BusService.simulate(busId)
            toast({
                title: "Simulation démarrée",
                description: "Le bus devrait commencer à bouger sur la carte.",
            })
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de démarrer la simulation.",
                variant: "destructive"
            })
        } finally {
            setSimulating(false)
        }
    }

    // Créer une icône personnalisée pour les bus
    const createBusIcon = (isSelected: boolean) => {
        const iconHtml = `
      <div style="
        background-color: ${isSelected ? '#3b82f6' : '#10b981'};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 16px;
      ">
        🚌
      </div>
    `

        return L.divIcon({
            html: iconHtml,
            className: "bus-marker",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
        })
    }

    // Mettre à jour les marqueurs
    useEffect(() => {
        if (!mapRef.current) return

        const map = mapRef.current
        const currentMarkers = markersRef.current

        // Créer/Mettre à jour les marqueurs pour chaque bus avec position
        buses.forEach((bus) => {
            const position = positions.get(bus.id)
            if (!position) {
                // Supprimer le marqueur si plus de position
                const marker = currentMarkers.get(bus.id)
                if (marker) {
                    map.removeLayer(marker)
                    currentMarkers.delete(bus.id)
                }
                return
            }

            const latLng: L.LatLngExpression = [position.latitude, position.longitude]
            const isSelected = selectedBusId === bus.id

            let marker = currentMarkers.get(bus.id)

            if (marker) {
                // Mettre à jour position et icône
                marker.setLatLng(latLng)
                marker.setIcon(createBusIcon(isSelected))
            } else {
                // Créer nouveau marqueur
                marker = L.marker(latLng, {
                    icon: createBusIcon(isSelected),
                }).addTo(map)

                // Popup avec infos
                marker.bindPopup(`
          <div style="font-family: sans-serif;">
            <strong style="font-size: 16px;">${bus.matricule}</strong>
            <p style="margin: 5px 0; color: #666;">${bus.description}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #999;">
              Ligne ${bus.trajetId}
            </p>
            <p style="margin: 5px 0; font-size: 11px; color: #999;">
              📍 ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}
            </p>
          </div>
          </div>
          <div style="margin-top: 8px;">
             <button 
                onclick="window.dispatchEvent(new CustomEvent('start-simulation', { detail: ${bus.id} }))"
                style="
                    background-color: #3b82f6; 
                    color: white; 
                    border: none; 
                    padding: 6px 12px; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    width: 100%;
                    justify-content: center;
                "
             >
                ▶ Démarrer Simulation
             </button>
          </div>
        `)

                // Click handler
                marker.on("click", () => {
                    onBusSelect(bus.id)
                })

                currentMarkers.set(bus.id, marker)
            }

            // Centrer sur le bus sélectionné
            if (isSelected) {
                map.setView(latLng, 15, { animate: true })
            }
        })

        // Supprimer les marqueurs des bus qui n'existent plus
        currentMarkers.forEach((marker, busId) => {
            if (!buses.find(b => b.id === busId)) {
                map.removeLayer(marker)
                currentMarkers.delete(busId)
            }
        })
    }, [buses, positions, selectedBusId, onBusSelect])

    // Listen for custom event from popup button
    useEffect(() => {
        const handleSimulationEvent = (e: any) => {
            const busId = e.detail
            if (busId) {
                handleStartSimulation({ stopPropagation: () => { } } as any, busId)
            }
        }

        window.addEventListener('start-simulation', handleSimulationEvent)
        return () => window.removeEventListener('start-simulation', handleSimulationEvent)
    }, [])

    // Adapter la vue pour voir tous les bus
    useEffect(() => {
        if (!mapRef.current || positions.size === 0 || selectedBusId) return

        const bounds = L.latLngBounds(
            Array.from(positions.values()).map(pos => [pos.latitude, pos.longitude] as L.LatLngExpression)
        )

        if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds, { padding: [50, 50] })
        }
    }, [positions, selectedBusId])

    return (
        <div
            ref={containerRef}
            className="h-[600px] w-full rounded-lg border shadow-lg"
            style={{ zIndex: 0 }}
        >
        </div>
    )
}
