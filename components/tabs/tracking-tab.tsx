"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface BusLocation {
  busId: string
  route: string
  location: string
  latitude: string
  longitude: string
  nextStop: string
  eta: string
  occupancy: number
  speed: string
  delay: number
}

export default function TrackingTab() {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)

  const buses: BusLocation[] = [
    {
      busId: "BUS-001",
      route: "Route 42",
      location: "Main Street",
      latitude: "40.7128",
      longitude: "-74.0060",
      nextStop: "Central Plaza",
      eta: "2 min",
      occupancy: 75,
      speed: "25 km/h",
      delay: 0,
    },
    {
      busId: "BUS-002",
      route: "Route 15",
      location: "Park Avenue",
      latitude: "40.7580",
      longitude: "-73.9855",
      nextStop: "Shopping Mall",
      eta: "5 min",
      occupancy: 45,
      speed: "18 km/h",
      delay: 2,
    },
    {
      busId: "BUS-003",
      route: "Express 7",
      location: "Highway 1",
      latitude: "40.6413",
      longitude: "-73.7781",
      nextStop: "Airport Terminal",
      eta: "8 min",
      occupancy: 60,
      speed: "65 km/h",
      delay: 0,
    },
  ]

  const filteredBuses = selectedRoute ? buses.filter((b) => b.route === selectedRoute) : buses

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="font-semibold mb-4">Real-time Bus Tracking</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Filter by Route</label>
            <Input
              placeholder="Route 42, Express 7, etc."
              value={selectedRoute || ""}
              onChange={(e) => setSelectedRoute(e.target.value || null)}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredBuses.map((bus) => (
          <Card key={bus.busId} className="p-6 hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Bus ID & Route</p>
                <p className="font-bold text-lg">{bus.busId}</p>
                <p className="font-semibold text-primary">{bus.route}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Location</p>
                <p className="font-semibold">{bus.location}</p>
                <p className="text-xs text-muted-foreground">
                  {bus.latitude}, {bus.longitude}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <div className="space-y-1">
                  <p className="font-semibold">
                    Next: <span className="text-accent">{bus.nextStop}</span>
                  </p>
                  <p className="text-sm">ETA: {bus.eta}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Speed: {bus.speed} • Occupancy: {bus.occupancy}%
                  </p>
                  {bus.delay > 0 && <p className="text-xs text-orange-600">⚠️ {bus.delay} min delay</p>}
                </div>
              </div>
            </div>

            {/* Occupancy bar */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">Occupancy</span>
                <span className="text-xs font-semibold">{bus.occupancy}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: `${bus.occupancy}%` }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
