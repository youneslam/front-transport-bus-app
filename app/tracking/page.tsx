"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { busSocketService, BusService, LocationService } from "@/services/bus"
import type { Bus, BusLocationPayload } from "@/services/bus"
import { Radio, MapPin } from "lucide-react"

// Import dynamique de la carte pour éviter les erreurs SSR
const BusMap = dynamic(() => import("@/components/tracking/bus-map"), {
    ssr: false,
    loading: () => (
        <div className="h-[600px] bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Chargement de la carte...</p>
        </div>
    ),
})

export default function TrackingPage() {
    const [buses, setBuses] = useState<Bus[]>([])
    const [positions, setPositions] = useState<Map<number, BusLocationPayload>>(new Map())
    const [connected, setConnected] = useState(false)
    const [selectedBus, setSelectedBus] = useState<number | null>(null)

    // Charger les bus
    useEffect(() => {
        BusService.list()
            .then(setBuses)
            .catch(console.error)
    }, [])

    // Charger les dernières positions connues
    useEffect(() => {
        buses.forEach(async (bus) => {
            const location = await LocationService.getLatestLocation(bus.id)
            if (location) {
                setPositions(prev => new Map(prev).set(bus.id, {
                    busId: location.busId,
                    latitude: location.latitude,
                    longitude: location.longitude,
                }))
            }
        })
    }, [buses])

    // WebSocket temps réel
    useEffect(() => {
        // Vérifier l'état de connexion
        const checkInterval = setInterval(() => {
            setConnected(busSocketService.isConnected())
        }, 1000)

        // Écouter les mises à jour
        const unsubscribe = busSocketService.addListener((payload) => {
            console.log("📍 Position mise à jour:", payload)
            setPositions(prev => new Map(prev).set(payload.busId, payload))
        })

        return () => {
            clearInterval(checkInterval)
            unsubscribe()
        }
    }, [])

    const activeBuses = buses.filter(bus => positions.has(bus.id))

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <MapPin className="h-8 w-8 text-primary" />
                        Tracking Bus en Temps Réel
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Suivez la position de tous les bus du réseau
                    </p>
                </div>
                <Badge variant={connected ? "default" : "secondary"} className="px-4 py-2">
                    <Radio className="mr-2 h-4 w-4" />
                    {connected ? "En direct" : "Connexion..."}
                </Badge>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Liste des bus */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Bus Actifs ({activeBuses.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {activeBuses.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Aucun bus en ligne
                            </p>
                        ) : (
                            activeBuses.map((bus) => {
                                const position = positions.get(bus.id)
                                return (
                                    <button
                                        key={bus.id}
                                        onClick={() => setSelectedBus(bus.id)}
                                        className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedBus === bus.id
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "hover:bg-muted border-border"
                                            }`}
                                    >
                                        <div className="font-semibold">{bus.matricule}</div>
                                        <div className="text-sm opacity-90">{bus.description}</div>
                                        {position && (
                                            <div className="text-xs mt-2 opacity-75">
                                                {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}
                                            </div>
                                        )}
                                    </button>
                                )
                            })
                        )}
                    </CardContent>
                </Card>

                {/* Carte */}
                <div className="lg:col-span-3">
                    <BusMap
                        buses={buses}
                        positions={positions}
                        selectedBusId={selectedBus}
                        onBusSelect={setSelectedBus}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{buses.length}</div>
                        <p className="text-xs text-muted-foreground">Bus Total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{activeBuses.length}</div>
                        <p className="text-xs text-muted-foreground">En Ligne</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">
                            {buses.length - activeBuses.length}
                        </div>
                        <p className="text-xs text-muted-foreground">Hors Ligne</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
