"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { Ticket, Route, Building2, DollarSign, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { listTickets, AdminTicket } from '@/lib/api/tickets'

export default function AdminTicketsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!token || !isAdmin) {
      router.push("/login")
    } else {
      load()
    }
  }, [router])

  const load = async () => {
    setLoading(true)
    try {
      const data = await listTickets()
      setTickets(data)
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de charger les tickets.' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
            Gestion des Tickets
          </h1>
          <p className="section-description">Voir tous les tickets créés par trajet</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Tickets</p>
                <p className="text-3xl font-bold text-primary mt-2">{tickets.length}</p>
              </div>
              <Ticket className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Trajets uniques</p>
                <p className="text-3xl font-bold text-accent mt-2">
                  {new Set(tickets.map(t => t.trajetId)).size}
                </p>
              </div>
              <Route className="w-8 h-8 text-accent/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Villes</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {new Set(tickets.map(t => t.cityName)).size}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Chargement...</div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center">
              <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">Aucun ticket disponible.</p>
              <p className="text-sm text-muted-foreground">
                Les tickets sont créés automatiquement lors de la création d'un trajet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-4 px-6 font-semibold text-sm">Trajet</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Ville</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Prix</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Description</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Date de création</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Route className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{ticket.nomTrajet}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Trajet #{ticket.trajetId}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="gap-1">
                          <Building2 className="w-3 h-3" />
                          {ticket.cityName}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="secondary" className="gap-1">
                          <DollarSign className="w-3 h-3" />
                          {ticket.price.toFixed(2)} DH
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-muted-foreground">
                          {ticket.description || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(ticket.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
