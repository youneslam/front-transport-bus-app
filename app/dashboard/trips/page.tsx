"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from 'next/navigation'
import { MapPin, CalendarDays } from 'lucide-react'
import { fetchUserTickets, UserTicket } from '@/lib/api/user-tickets'
import { fetchAllTrajets, Trajet } from '@/lib/api/trajets'
import { fetchCities, City } from '@/lib/api/cities'

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
    })
  }, [tickets, date, search, trajets])

  const totalValid = useMemo(() => tickets.reduce((s, t) => s + (t.valid ? 1 : 0), 0), [tickets])

  const aggregates = useMemo(() => {
    const map = new Map<number, { trajet?: Trajet; city?: City; count: number; totalPrice: number }>()
    filtered.forEach((tk) => {
      const traj = trajets.find((tr) => tr.id === tk.ticketId)
      const trajetId = traj?.id ?? -1
      const city = traj ? cities.find((c) => c.id === traj.cityId) : undefined
      const price = city?.priceInDhs ?? 0
      const entry = map.get(trajetId) || { trajet: traj, city, count: 0, totalPrice: 0 }
      entry.trajet = traj
      entry.city = city
      entry.count += 1
      entry.totalPrice = Number((entry.totalPrice + price).toFixed(2))
      map.set(trajetId, entry)
    })

    return Array.from(map.values()).filter(it => it.count > 0)
  }, [filtered, trajets, cities])

  return (
    <div>
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="section-header">My Trips</h1>
          {/* removed the small side description as requested */}
        </div>

        {/* Top summary cards (styled like dashboard stat cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {aggregates.length === 0 ? (
            <div className="stat-card rounded-xl col-span-1 md:col-span-2 lg:col-span-4">
              <div className="text-sm text-muted-foreground">Aucun trajet à afficher pour les filtres sélectionnés.</div>
            </div>
          ) : (
            aggregates.slice(0, 4).map((it, i) => (
              <div key={i} className="stat-card rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{it.trajet?.nomTrajet ?? 'Trajet'}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{it.count}</p>
                    <p className="text-xs text-muted-foreground mt-2">{it.city?.cityName ?? 'Ville inconnue'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-accent mt-2">{it.totalPrice} DH</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

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
            <div className="space-y-4">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`card-premium rounded-xl p-5 cursor-pointer transition-all ${selectedTicket?.id === t.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-foreground">Ticket #{t.ticketId}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{t.userName}</div>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-medium ${t.valid ? 'text-green-600' : 'text-red-600'}`}>{t.valid ? 'Valid' : 'Invalid'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {t.validatedAt && <p className="text-sm text-muted-foreground">Validated at: {new Date(t.validatedAt).toLocaleString()}</p>}
                </div>
              ))}
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
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Ticket ID</p>
                  <p className="text-foreground font-semibold mt-1">#{selectedTicket.ticketId}</p>
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

                <button className="w-full mt-4 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium">
                  Rebook
                </button>
              </div>
            </div>
          )}

        </div>

        
      </div>
    </div>
  )
}
