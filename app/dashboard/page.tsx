"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { ArrowUpRight, TrendingUp, Zap, Award, MapPin, Bus, Ticket } from 'lucide-react'
import { fetchUserTickets } from '@/lib/api/user-tickets'
import { fetchCurrentSubscription } from '@/lib/api/subscriptions'
import { listTrajets, fetchCities } from '@/lib/api'
import type { UserTicket } from '@/lib/api/user-tickets'
import type { SubscriptionPurchaseResponse } from '@/lib/api/subscriptions'

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [loading, setLoading] = useState(true)
  const [totalTickets, setTotalTickets] = useState(0)
  const [ticketsThisMonth, setTicketsThisMonth] = useState(0)
  const [activeSubscription, setActiveSubscription] = useState<SubscriptionPurchaseResponse | null>(null)
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [totalRoutes, setTotalRoutes] = useState(0)
  const [totalCities, setTotalCities] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const name = localStorage.getItem("userName")
    const isAdmin = localStorage.getItem("isAdmin") === "true"

    if (!token) {
      router.push("/login")
      return
    }

    // If user is admin, redirect them to the admin dashboard instead of user overview
    if (isAdmin) {
      router.push("/dashboard/admin")
      return
    }

    setUserName(name || "User")

    // Load user dashboard data
    const loadDashboardData = async () => {
      const userId = localStorage.getItem("userId")
      if (!userId) return

      try {
        setLoading(true)
        
        // Fetch user tickets
        const tickets = await fetchUserTickets(parseInt(userId))
        setTotalTickets(tickets.length)

        // Count tickets from this month
        const now = new Date()
        const thisMonth = tickets.filter(ticket => {
          const ticketDate = new Date(ticket.createdAt)
          return ticketDate.getMonth() === now.getMonth() && ticketDate.getFullYear() === now.getFullYear()
        }).length
        setTicketsThisMonth(thisMonth)

        // Fetch active subscription
        const subscription = await fetchCurrentSubscription(parseInt(userId))
        setActiveSubscription(subscription)

        if (subscription) {
          // Calculate days remaining
          const endDate = new Date(subscription.endDate)
          const today = new Date()
          const diffTime = endDate.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          setDaysRemaining(diffDays > 0 ? diffDays : 0)
        }

        // Fetch routes and cities
        const [routes, cities] = await Promise.all([
          listTrajets(),
          fetchCities()
        ])
        setTotalRoutes(routes.length)
        setTotalCities(cities.length)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [router])

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="section-header">Welcome back, {userName}</h1>
        <p className="section-description">Here's your transportation overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="stat-card rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Mes Billets</p>
              <p className="text-3xl font-bold text-primary mt-2">{loading ? "..." : totalTickets}</p>
              <p className="text-xs text-muted-foreground mt-2">{ticketsThisMonth} achetés ce mois</p>
            </div>
            <Ticket className="w-6 h-6 text-primary/40" />
          </div>
        </div>

        <div className="stat-card rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Abonnement</p>
              <p className="text-2xl font-bold text-accent mt-2">
                {loading ? "..." : activeSubscription ? (
                  activeSubscription.type === 'MONTHLY' ? 'Mensuel' : 'Annuel'
                ) : 'Aucun'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {activeSubscription ? `${daysRemaining} jours restants` : 'Pas d\'abonnement actif'}
              </p>
            </div>
            <Zap className="w-6 h-6 text-accent/40" />
          </div>
        </div>

        <div className="stat-card rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Routes Disponibles</p>
              <p className="text-3xl font-bold text-primary mt-2">{loading ? "..." : totalRoutes}</p>
              <p className="text-xs text-muted-foreground mt-2">Lignes de bus actives</p>
            </div>
            <Bus className="w-6 h-6 text-primary/40" />
          </div>
        </div>

        <div className="stat-card rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Villes Desservies</p>
              <p className="text-3xl font-bold text-accent mt-2">{loading ? "..." : totalCities}</p>
              <p className="text-xs text-muted-foreground mt-2">Destinations disponibles</p>
            </div>
            <MapPin className="w-6 h-6 text-accent/40" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card-premium rounded-xl p-6">
          <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg mb-4 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Bus Booking Image</p>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Book Your Next Trip</h3>
          <p className="text-sm text-muted-foreground mb-4">Find and book buses for your next journey</p>
          <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium">
            Book Now
          </button>
        </div>

        <div className="card-premium rounded-xl p-6">
          <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg mb-4 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Live Tracking Map</p>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Track Your Bus</h3>
          <p className="text-sm text-muted-foreground mb-4">Real-time GPS tracking of your buses</p>
          <button className="w-full bg-accent text-accent-foreground py-2 rounded-lg hover:bg-accent/90 transition-colors font-medium">
            Track Now
          </button>
        </div>

        <div className="card-premium rounded-xl p-6">
          <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg mb-4 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Pass Subscription</p>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Get a Pass</h3>
          <p className="text-sm text-muted-foreground mb-4">Save more with our subscription passes</p>
          <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium">
            View Plans
          </button>
        </div>
      </div>
    </div>
  )
}
