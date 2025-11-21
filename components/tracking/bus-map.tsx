"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "./bus-map.css"
import type { Bus, BusLocationPayload } from "@/services/bus"

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
    const containerRef = useRef<HTMLDivElement>(null)

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

        mapRef.current = map

        return () => {
            map.remove()
            mapRef.current = null
        }
    }, [])

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
        />
    )
}
