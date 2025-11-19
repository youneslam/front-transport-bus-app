"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, MapPin } from "lucide-react"
import { fetchAllTrajets } from '@/lib/api/trajets'
import { formatDuration } from '@/lib/api/utils'
import type { Trajet } from '@/lib/api/trajets'

export interface Ticket {
  id: string
  bookingRef: string
  trajetId: number
  trajetName: string
  from: string
  to: string
  date: string
  departure: string
  seat: string
  price: number
  status: "upcoming" | "completed" | "cancelled"
}

export default function TicketsTab() {
  const [trajets, setTrajets] = useState<Trajet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTrajets = async () => {
      const data = await fetchAllTrajets()
      setTrajets(data)
      setLoading(false)
    }
    loadTrajets()
  }, [])

  // Exemple de tickets - tu remplaceras ça par un vrai fetch plus tard
  const tickets: Ticket[] = [
    {
      id: "1",
      bookingRef: "UG2024001",
      trajetId: 1,
      trajetName: "Ligne A",
      from: "Station A",
      to: "Station B",
      date: "Nov 15, 2024",
      departure: "09:00",
      seat: "A12",
      price: 450,
      status: "upcoming",
    },
    {
      id: "2",
      bookingRef: "UG2024002",
      trajetId: 1,
      trajetName: "Ligne A",
      from: "Station A",
      to: "Station B",
      date: "Nov 12, 2024",
      departure: "09:30",
      seat: "B08",
      price: 450,
      status: "completed",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-50 border-blue-200 text-blue-900"
      case "completed":
        return "bg-green-50 border-green-200 text-green-900"
      case "cancelled":
        return "bg-red-50 border-red-200 text-red-900"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getTrajetDetails = (trajetId: number) => {
    return trajets.find(t => t.id === trajetId)
  }

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Chargement...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Aucun billet réservé</p>
          <Button className="bg-primary hover:bg-primary/90">Parcourir les Trajets</Button>
        </Card>
      ) : (
        tickets.map((ticket) => {
          const trajetDetails = getTrajetDetails(ticket.trajetId)
          return (
            <Card key={ticket.id} className={`p-6 border ${getStatusColor(ticket.status)}`}>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                <div>
                  <p className="text-xs font-semibold opacity-75">Référence</p>
                  <p className="font-mono font-bold text-lg">{ticket.bookingRef}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold opacity-75">Trajet</p>
                  <p className="font-semibold">{ticket.trajetName}</p>
                  {trajetDetails && (
                    <div className="flex items-center gap-1 text-xs opacity-75 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(trajetDetails.dureeEstimee)}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold opacity-75">Parcours</p>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="font-semibold">{ticket.from}</span>
                    <MapPin className="w-3 h-3 opacity-50" />
                    <span className="font-semibold">{ticket.to}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold opacity-75">Date & Heure</p>
                  <p className="font-semibold">{ticket.date}</p>
                  <p className="text-sm opacity-75">{ticket.departure}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold opacity-75">Siège</p>
                  <p className="font-bold text-lg">{ticket.seat}</p>
                  <p className="text-xs font-semibold opacity-75 mt-1">Prix</p>
                  <p className="font-bold">{ticket.price} DH</p>
                </div>
                <div className="text-right space-y-2">
                  <div>
                    <p className="text-xs font-semibold opacity-75">Statut</p>
                    <p className="font-semibold">{getStatusLabel(ticket.status)}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Voir Détails
                  </Button>
                </div>
              </div>
            </Card>
          )
        })
      )}
    </div>
  )
}