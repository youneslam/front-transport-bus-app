/**
 * Exemple d'utilisation des services Bus
 * Démontre l'intégration REST API + WebSocket pour le tracking en temps réel
 */

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BusService, LocationService, busSocketService } from "@/services/bus"
import type { Bus, BusLocationPayload } from "@/services/bus"
import { MapPin, Radio } from "lucide-react"

export function BusTrackingExample() {
    const [buses, setBuses] = useState<Bus[]>([])
    const [positions, setPositions] = useState<Map<number, BusLocationPayload>>(new Map())
    const [wsConnected, setWsConnected] = useState(false)

    // Charger la liste des bus
    useEffect(() => {
        BusService.list()
            .then(setBuses)
            .catch(console.error)
    }, [])

    // S'abonner aux mises à jour WebSocket
    useEffect(() => {
        const unsubscribe = busSocketService.addListener((payload) => {
            setPositions((prev) => new Map(prev).set(payload.busId, payload))
        })

        // Vérifier l'état de connexion
        const checkConnection = setInterval(() => {
            setWsConnected(busSocketService.isConnected())
        }, 1000)

        return () => {
            unsubscribe()
            clearInterval(checkConnection)
        }
    }, [])

    // Charger la dernière position connue pour chaque bus
    useEffect(() => {
        buses.forEach(async (bus) => {
            const location = await LocationService.getLatestLocation(bus.id)
            if (location) {
                // Convertir LocationData en BusLocationPayload
                const payload: BusLocationPayload = {
                    busId: location.busId,
                    latitude: location.latitude,
                    longitude: location.longitude,
                }
                setPositions((prev) => new Map(prev).set(bus.id, payload))
            }
        })
    }, [buses])

    // Simuler une mise à jour de position
    const simulateUpdate = async (busId: number) => {
        try {
            await LocationService.updateLocation({
                busId,
                latitude: 48.8566 + Math.random() * 0.01,
                longitude: 2.3522 + Math.random() * 0.01,
                timestamp: Date.now(),
            })
        } catch (error) {
            console.error("Erreur lors de la simulation:", error)
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Tracking Bus en Temps Réel</h1>
                <Badge variant={wsConnected ? "default" : "destructive"}>
                    <Radio className="mr-2 h-4 w-4" />
                    {wsConnected ? "WebSocket Connecté" : "Déconnecté"}
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {buses.map((bus) => {
                    const position = positions.get(bus.id)
                    return (
                        <Card key={bus.id}>
                            <CardHeader>
                                <CardTitle>{bus.matricule}</CardTitle>
                                <CardDescription>{bus.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {position ? (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 mt-1 text-primary" />
                                        <div className="text-sm">
                                            <div>Lat: {position.latitude.toFixed(6)}</div>
                                            <div>Lng: {position.longitude.toFixed(6)}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Aucune position</p>
                                )}
                                <Button
                                    onClick={() => simulateUpdate(bus.id)}
                                    size="sm"
                                    className="w-full"
                                >
                                    Simuler Déplacement
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {buses.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        Aucun bus disponible. Créez-en un depuis l'API.
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
