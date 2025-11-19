"use client"

import Navbar from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { BusMap } from "@/components/bus/bus-map"
import { SimulateBus } from "@/components/bus/simulate-bus"
import { MapPin, Waves } from "lucide-react"

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <header className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-widest text-primary font-semibold">Passager</p>
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <MapPin className="w-8 h-8 text-primary" />
            Localisation temps réel
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Observez tous les bus actifs sur la carte. Les marqueurs se mettent à jour automatiquement à chaque message
            reçu depuis le WebSocket <code>/topic/bus/locations</code>.
          </p>
        </header>

        <BusMap />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Waves className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Comment ça marche ?</h2>
                <p className="text-sm text-muted-foreground">
                  Les bus publient leur position via <code>/app/bus/location/send</code>. Tous les passagers écoutent le
                  topic public et mettent la carte à jour en direct, sans rafraîchir la page.
                </p>
              </div>
            </div>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>L&apos;admin gère les bus (matricule, description, trajet) via l&apos;API REST.</li>
              <li>Chaque message JSON doit contenir <code>busId</code>, <code>latitude</code> et <code>longitude</code>.</li>
              <li>Le SocketService gère la reconnexion automatique et distribue les positions aux composants.</li>
            </ul>
          </Card>

          <SimulateBus />
        </div>
      </div>
    </div>
  )
}

