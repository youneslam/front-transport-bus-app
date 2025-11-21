"use client"

import { useEffect, useState } from "react"
import { Satellite, Send, MapPinOff } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { LocationService } from "@/services/bus"

interface LastPosition {
  latitude: number
  longitude: number
  timestamp: number
}

export function SimulateBus() {
  const { toast } = useToast()
  const [busId, setBusId] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [lastPosition, setLastPosition] = useState<LastPosition | null>(null)
  const [manualLat, setManualLat] = useState("")
  const [manualLng, setManualLng] = useState("")

  useEffect(() => {
    return () => {
      if (watchId !== null && navigator?.geolocation) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  const sendPayload = async (latitude: number, longitude: number) => {
    if (!busId.trim()) {
      toast({
        title: "Bus ID requis",
        description: "Indiquez un identifiant de bus avant d'envoyer une position.",
        variant: "destructive",
      })
      return
    }
    try {
      await LocationService.updateLocation({
        busId: Number(busId),
        latitude,
        longitude,
        timestamp: Date.now(),
      })
      setLastPosition({ latitude, longitude, timestamp: Date.now() })
      toast({ title: "Position envoyée" })
    } catch (error) {
      toast({
        title: "Erreur API",
        description: error instanceof Error ? error.message : "Impossible d'envoyer la position.",
        variant: "destructive",
      })
    }
  }

  const startStreaming = () => {
    if (!navigator?.geolocation) {
      toast({
        title: "Géolocalisation indisponible",
        description: "Ce navigateur ne supporte pas la géolocalisation.",
        variant: "destructive",
      })
      return
    }
    if (!busId.trim()) {
      toast({
        title: "Bus ID requis",
        description: "Indiquez un identifiant de bus.",
        variant: "destructive",
      })
      return
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        sendPayload(position.coords.latitude, position.coords.longitude)
      },
      (error) => {
        console.error(error)
        toast({
          title: "Erreur GPS",
          description: error.message,
          variant: "destructive",
        })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
    setWatchId(id)
    setIsStreaming(true)
  }

  const stopStreaming = () => {
    if (watchId !== null && navigator?.geolocation) {
      navigator.geolocation.clearWatch(watchId)
    }
    setWatchId(null)
    setIsStreaming(false)
  }

  const sendManualPosition = () => {
    const latitude = Number(manualLat)
    const longitude = Number(manualLng)
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast({
        title: "Coordonnées invalides",
        description: "Veuillez saisir des valeurs numériques.",
        variant: "destructive",
      })
      return
    }
    sendPayload(latitude, longitude)
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Satellite className="w-5 h-5 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Simulation GPS</h3>
          <p className="text-sm text-muted-foreground">Envoyez la position du bus pour tester les flux temps réel.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="busId">Bus ID *</Label>
          <Input id="busId" value={busId} onChange={(event) => setBusId(event.target.value)} placeholder="Ex: 12" />
        </div>
        <div className="space-y-2">
          <Label>Latitude (manuel)</Label>
          <Input value={manualLat} onChange={(event) => setManualLat(event.target.value)} placeholder="33.57" />
        </div>
        <div className="space-y-2">
          <Label>Longitude (manuel)</Label>
          <Input value={manualLng} onChange={(event) => setManualLng(event.target.value)} placeholder="-7.59" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={isStreaming ? stopStreaming : startStreaming} className="gap-2">
          {isStreaming ? (
            <>
              <MapPinOff className="w-4 h-4" />
              Arrêter
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Commencer
            </>
          )}
        </Button>

        <Button variant="outline" onClick={sendManualPosition}>
          Envoyer les coordonnées manuelles
        </Button>

        {lastPosition && (
          <p className="text-sm text-muted-foreground">
            Dernier envoi: {lastPosition.latitude.toFixed(5)}, {lastPosition.longitude.toFixed(5)} à{" "}
            {new Date(lastPosition.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </Card>
  )
}
