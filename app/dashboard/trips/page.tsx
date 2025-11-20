"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from 'next/navigation'
import { MapPin, TrendingUp, DollarSign, Download } from 'lucide-react'
import { fetchUserTickets, UserTicket } from '@/lib/api/user-tickets'
import { fetchAllTrajets, Trajet } from '@/lib/api/trajets'
import { fetchCities, City } from '@/lib/api/cities'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import QRCodeGenerator from '@/components/QRCodeGenerator'

export default function TripsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<UserTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null)
  const [trajets, setTrajets] = useState<Trajet[]>([])
  const [cities, setCities] = useState<City[]>([])

  // Filters (single day) + search by trajet
  const [date, setDate] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!token) {
      router.push("/login")
      return
    }
    if (isAdmin) {
      router.push("/dashboard/admin")
      return
    }

    const load = async () => {
      const userId = typeof window !== "undefined" ? Number(localStorage.getItem('userId') || '1') : 1
      const [data, trajetsData, citiesData] = await Promise.all([
        fetchUserTickets(userId),
        fetchAllTrajets(),
        fetchCities(),
      ])
      setTickets(data || [])
      setTrajets(trajetsData || [])
      setCities(citiesData || [])
    }

    load()
  }, [router])

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      // Only show valid/activated tickets
      if (!t.valid) return false

      const created = new Date(t.createdAt)
      if (date) {
        const start = new Date(date)
        start.setHours(0,0,0,0)
        const end = new Date(date)
        end.setHours(23,59,59,999)
        if (created < start || created > end) return false
      }

      if (search) {
        const s = search.toLowerCase()
        const traj = trajets.find((tr) => tr.id === t.ticketId)
        const trajName = traj?.nomTrajet ?? ''
        if (!trajName.toLowerCase().includes(s)) return false
      }

      return true
    }).sort((a, b) => {
      // Sort by createdAt in descending order (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [tickets, date, search, trajets])

  // Calculer les dépenses quotidiennes pour le graphique
  const dailySpending = useMemo(() => {
    const spendingByDate = new Map<string, number>()
    
    tickets.forEach(ticket => {
      const trajet = trajets.find(t => t.id === ticket.ticketId)
      const city = trajet ? cities.find(c => c.id === trajet.cityId) : undefined
      const price = city?.priceInDhs || 0
      
      const date = new Date(ticket.createdAt)
      const dateKey = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      
      const currentTotal = spendingByDate.get(dateKey) || 0
      spendingByDate.set(dateKey, currentTotal + price)
    })
    
    // Convertir en tableau trié par date
    return Array.from(spendingByDate.entries())
      .map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'))
        const dateB = new Date(b.date.split('/').reverse().join('-'))
        return dateA.getTime() - dateB.getTime()
      })
      .slice(-30) // Derniers 30 jours
  }, [tickets, trajets, cities])

  const totalSpending = useMemo(() => {
    return dailySpending.reduce((sum, day) => sum + day.amount, 0)
  }, [dailySpending])

  return (
    <div>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-header">My Trips</h1>
          <p className="section-description">Suivez vos voyages et votre consommation</p>
        </div>

        {/* Graphique de consommation quotidienne avec Chart UI */}
        {tickets.length > 0 ? (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Consommation quotidienne
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Dépenses quotidiennes sur les 30 derniers jours
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-2xl font-bold text-primary flex items-center gap-1">
                    <DollarSign className="w-5 h-5" />
                    {totalSpending.toFixed(2)} DH
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dailySpending.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune donnée de consommation disponible</p>
                </div>
              ) : (
                <>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dailySpending}
                        margin={{
                          top: 10,
                          right: 20,
                          left: 10,
                          bottom: 40,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis
                          dataKey="date"
                          stroke="var(--color-muted-foreground)"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          angle={-40}
                          textAnchor="end"
                          height={70}
                          style={{ fontSize: '11px' }}
                        />
                        <YAxis
                          stroke="var(--color-muted-foreground)"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          style={{ fontSize: '11px' }}
                          label={{ 
                            value: 'Montant (DH)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fontSize: '12px' }
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${Number(value).toFixed(2)} DH`, 'Dépense']}
                        />
                        <Legend />
                        <Bar 
                          dataKey="amount" 
                          fill="var(--color-primary)"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                
                  {/* Statistiques */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Total dépensé</div>
                      <div className="text-2xl font-bold text-primary">{totalSpending.toFixed(2)} DH</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Jours avec achats</div>
                      <div className="text-2xl font-bold text-foreground">{dailySpending.length}</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Moyenne quotidienne</div>
                      <div className="text-2xl font-bold text-accent">
                        {dailySpending.length > 0 ? (totalSpending / dailySpending.length).toFixed(2) : '0'} DH
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun ticket trouvé</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top controls & stats - grouped filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            <input placeholder="Rechercher par trajet" value={search} onChange={(e) => setSearch(e.target.value)} className="input min-w-0 flex-1 md:flex-none" />
          </div>
        </div>

        {/* Compute aggregates per trajet based on the currently filtered tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-foreground mb-4">Recent Tickets</h2>
            <div className="space-y-4 p-2 max-h-[600px] overflow-y-auto pr-2">
              {filtered.map((t) => {
                const trajet = trajets.find((tr) => tr.id === t.ticketId)
                return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`card-premium rounded-xl p-5 cursor-pointer transition-all ${selectedTicket?.id === t.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-foreground">Ticket #{t.id}</span>
                      </div>
                      <div className="text-sm font-medium text-foreground mt-1">{trajet?.nomTrajet || 'Unknown Route'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.userName}</div>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-medium ${t.valid ? 'text-green-600' : 'text-red-600'}`}>{t.valid ? 'Valid' : 'Invalid'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {t.validatedAt && <p className="text-sm text-muted-foreground">Validated at: {new Date(t.validatedAt).toLocaleString()}</p>}
                </div>
                )
              })}
              {filtered.length === 0 && (
                <div className="text-center text-muted-foreground py-8">No tickets found for the selected filters.</div>
              )}
            </div>
          </div>

          {selectedTicket && (
            <div className="card-premium rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Ticket Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Achat ID</p>
                  <p className="text-foreground font-semibold mt-1">#{selectedTicket.id}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Trajet</p>
                  <p className="text-foreground font-semibold mt-1">
                    {trajets.find((tr) => tr.id === selectedTicket.ticketId)?.nomTrajet || 'Unknown Route'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">User</p>
                  <p className="text-foreground font-semibold mt-1">{selectedTicket.userName}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Purchased</p>
                  <p className="text-foreground font-semibold mt-1">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Status</p>
                  <p className={`text-2xl font-bold mt-1 ${selectedTicket.valid ? 'text-green-600' : 'text-red-600'}`}>{selectedTicket.valid ? 'Valid' : 'Invalid'}</p>
                </div>

                {selectedTicket.validatedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Validated At</p>
                    <p className="text-foreground mt-1">{new Date(selectedTicket.validatedAt).toLocaleString()}</p>
                  </div>
                )}

                {/* QR Code Section */}
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-3">QR Code</p>
                  <QRCodeGenerator achatId={selectedTicket.id} size={180} />
                </div>
              </div>
            </div>
          )}

        </div>

        
      </div>
    </div>
  )
}
