"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { BarChart3, Users, Bus, TrendingUp, MapPin, Ticket, Activity, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { listUsers } from "@/lib/api/auth"
import { listTickets, listAchats } from "@/lib/api"
import { listTrajets, fetchCities, listStations } from "@/lib/api"
import { listSubscriptionCities } from "@/lib/api/subscriptions"
import { listNotifications, listAbonnementNotifications } from "@/lib/api/notifications"

interface DashboardStats {
  totalUsers: number
  totalTickets: number
  totalRevenue: number
  totalRoutes: number
  totalCities: number
  totalStations: number
  activeSubscriptions: number
  ticketsSoldToday: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTickets: 0,
    totalRevenue: 0,
    totalRoutes: 0,
    totalCities: 0,
    totalStations: 0,
    activeSubscriptions: 0,
    ticketsSoldToday: 0,
  })
  const [revenueByCity, setRevenueByCity] = useState<any[]>([])
  const [routeDistribution, setRouteDistribution] = useState<any[]>([])
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [subscriptionTrend, setSubscriptionTrend] = useState<any[]>([])
  const [ticketTrend, setTicketTrend] = useState<any[]>([])
  const [subscriptionTypes, setSubscriptionTypes] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const admin = localStorage.getItem("isAdmin") === "true"

    if (!token || !admin) {
      router.push("/login")
      return
    }

    
    setIsAdmin(true)
    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [
        users,
        tickets,
        routes,
        cities,
        stations,
        subscriptionCities,
        ticketNotifications,
        subscriptionNotifications,
        achats
      ] = await Promise.all([
        listUsers(),
        listTickets(),
        listTrajets(),
        fetchCities(),
        listStations(),
        listSubscriptionCities(),
        listNotifications(),
        listAbonnementNotifications(),
        listAchats()
      ])

      // Calculate total revenue from achats (actual purchases with prices)
      const ticketRevenue = ticketNotifications.reduce((sum, notif) => sum + (notif.priceInDhs || 0), 0)
      
      // Calculate total revenue from subscriptions
      const subscriptionRevenue = subscriptionCities.reduce((sum, city) => {
        return sum + ((city.monthlyPriceNormal || 0) * 0.5) + ((city.yearlyPriceNormal || 0) * 0.1)
      }, 0)

      const totalRevenue = ticketRevenue + subscriptionRevenue

      // Count tickets sold today
      const today = new Date().toDateString()
      const ticketsSoldToday = ticketNotifications.filter(notif => {
        return new Date(notif.achatCreatedAt).toDateString() === today
      }).length

      // Active subscriptions (from last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const activeSubscriptions = subscriptionNotifications.filter(notif => {
        return new Date(notif.receivedAt) >= thirtyDaysAgo
      }).length

      setStats({
        totalUsers: users.length,
        totalTickets: tickets.length,
        totalRevenue: Math.round(totalRevenue),
        totalRoutes: routes.length,
        totalCities: cities.length,
        totalStations: stations.length,
        activeSubscriptions,
        ticketsSoldToday,
      })

      // Revenue by city - using ticketNotifications with actual prices
      const cityRevenueMap = new Map<string, number>()
      ticketNotifications.forEach(notif => {
        const cityName = notif.cityName || 'Unknown'
        cityRevenueMap.set(cityName, (cityRevenueMap.get(cityName) || 0) + (notif.priceInDhs || 0))
      })
      const cityRevenueData = Array.from(cityRevenueMap.entries())
        .map(([city, revenue]) => ({ city, revenue: Math.round(revenue) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
      setRevenueByCity(cityRevenueData)

      // Route distribution by city
      const routesByCity = new Map<string, number>()
      routes.forEach(route => {
        const city = cities.find(c => c.id === route.cityId)
        const cityName = city?.cityName || 'Unknown'
        routesByCity.set(cityName, (routesByCity.get(cityName) || 0) + 1)
      })
      const routeDistData = Array.from(routesByCity.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
      setRouteDistribution(routeDistData)

      // Recent tickets with route names - using ticketNotifications with actual data
      const recentTicketsData = ticketNotifications
        .sort((a, b) => new Date(b.achatCreatedAt).getTime() - new Date(a.achatCreatedAt).getTime())
        .slice(0, 10)
        .map(notif => ({
          id: notif.achatId,
          route: notif.nomTrajet || 'Unknown Route',
          city: notif.cityName || 'Unknown',
          price: notif.priceInDhs || 0,
          date: notif.achatCreatedAt
        }))
      setRecentTickets(recentTicketsData)

      // Subscription trend - last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return date.toISOString().split('T')[0]
      })
      const subTrendData = last7Days.map(dateStr => {
        const count = subscriptionNotifications.filter(notif => {
          const notifDate = new Date(notif.receivedAt).toISOString().split('T')[0]
          return notifDate === dateStr
        }).length
        return {
          date: new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          abonnements: count
        }
      })
      setSubscriptionTrend(subTrendData)

      // Ticket trend - last 7 days
      const ticketTrendData = last7Days.map(dateStr => {
        const count = ticketNotifications.filter(notif => {
          const notifDate = new Date(notif.achatCreatedAt).toISOString().split('T')[0]
          return notifDate === dateStr
        }).length
        const revenue = ticketNotifications
          .filter(notif => new Date(notif.achatCreatedAt).toISOString().split('T')[0] === dateStr)
          .reduce((sum, notif) => sum + (notif.priceInDhs || 0), 0)
        return {
          date: new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          tickets: count,
          revenu: Math.round(revenue)
        }
      })
      setTicketTrend(ticketTrendData)

      // Subscription types distribution
      const monthlyCount = subscriptionNotifications.filter(s => s.type === 'MONTHLY').length
      const yearlyCount = subscriptionNotifications.filter(s => s.type === 'YEARLY').length
      setSubscriptionTypes([
        { name: 'Mensuel', value: monthlyCount },
        { name: 'Annuel', value: yearlyCount }
      ])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Activity className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  const COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6']

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="section-header">Tableau de bord Admin</h1>
        <p className="section-description">Vue d'ensemble des performances du système et des opérations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="stat-card rounded-xl border-l-4 border-l-primary">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Revenu Total</p>
              <p className="text-3xl font-bold text-primary mt-2">{stats.totalRevenue.toLocaleString()} DH</p>
              <p className="text-xs text-primary/60 mt-2">{stats.totalTickets} tickets vendus</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary/20" />
          </div>
        </div>

        <div className="stat-card rounded-xl border-l-4 border-l-accent">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Utilisateurs Totaux</p>
              <p className="text-3xl font-bold text-accent mt-2">{stats.totalUsers}</p>
              <p className="text-xs text-accent/60 mt-2">Comptes enregistrés</p>
            </div>
            <Users className="w-8 h-8 text-accent/20" />
          </div>
        </div>

        <div className="stat-card rounded-xl border-l-4 border-l-green-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Abonnements Actifs</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeSubscriptions}</p>
              <p className="text-xs text-green-600/60 mt-2">30 derniers jours</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600/20" />
          </div>
        </div>

        <div className="stat-card rounded-xl border-l-4 border-l-orange-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Routes & Villes</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalRoutes}</p>
              <p className="text-xs text-green-600/60 mt-2">{stats.totalCities} villes, {stats.totalStations} stations</p>
            </div>
            <MapPin className="w-8 h-8 text-green-500/20" />
          </div>
        </div>

        <div className="stat-card rounded-xl border-l-4 border-l-orange-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Tickets Aujourd'hui</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.ticketsSoldToday}</p>
              <p className="text-xs text-orange-600/60 mt-2">Vendus aujourd'hui</p>
            </div>
            <Ticket className="w-8 h-8 text-orange-500/20" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by City Chart */}
        <div className="lg:col-span-2 card-premium rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Revenu par Ville (Top 5)
          </h3>
          {revenueByCity.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByCity} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 220, 255, 0.15)" />
                <XAxis dataKey="city" stroke="currentColor" className="text-muted-foreground text-sm" />
                <YAxis stroke="currentColor" className="text-muted-foreground text-sm" />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                <Bar dataKey="revenue" fill="#4f46e5" name="Revenu (DH)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Route Distribution by City */}
        <div className="card-premium rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Distribution des Routes
          </h3>
          {routeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={routeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {routeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Trend */}
        <div className="card-premium rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Tendance des Abonnements (7 derniers jours)
          </h3>
          {subscriptionTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={subscriptionTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 220, 255, 0.15)" />
                <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground text-sm" />
                <YAxis stroke="currentColor" className="text-muted-foreground text-sm" />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                <Line type="monotone" dataKey="abonnements" stroke="#10b981" strokeWidth={3} name="Abonnements" dot={{ fill: '#10b981', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Ticket Trend */}
        <div className="card-premium rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            Ventes de Tickets (7 derniers jours)
          </h3>
          {ticketTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={ticketTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 220, 255, 0.15)" />
                <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground text-sm" />
                <YAxis stroke="currentColor" className="text-muted-foreground text-sm" />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                <Line type="monotone" dataKey="tickets" stroke="#4f46e5" strokeWidth={3} name="Tickets" dot={{ fill: '#4f46e5', r: 5 }} />
                <Line type="monotone" dataKey="revenu" stroke="#06b6d4" strokeWidth={3} name="Revenu (DH)" dot={{ fill: '#06b6d4', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>

      {/* Subscription Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-premium rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Types d'Abonnements
          </h3>
          {subscriptionTypes.length > 0 && subscriptionTypes.some(s => s.value > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={subscriptionTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </div>

        <div className="lg:col-span-2 card-premium rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          Tickets Récents (10 derniers)
        </h3>
        {recentTickets.length > 0 ? (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">ID</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Route</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Ville</th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Prix</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-border/40 hover:bg-muted/50 transition-colors group">
                    <td className="py-4 px-4 text-foreground font-mono text-sm">#{ticket.id}</td>
                    <td className="py-4 px-4 text-foreground font-medium group-hover:text-primary transition-colors">{ticket.route}</td>
                    <td className="py-4 px-4">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium border border-primary/20">
                        {ticket.city}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-primary font-semibold">{ticket.price.toFixed(2)} DH</td>
                    <td className="py-4 px-4 text-muted-foreground text-sm">
                      {ticket.date ? new Date(ticket.date).toLocaleDateString('fr-FR') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Aucun ticket récent
          </div>
        )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          onClick={() => router.push('/dashboard/admin/routes')}
          className="card-premium rounded-xl p-6 hover:shadow-lg transition-all group text-left"
        >
          <MapPin className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="text-lg font-semibold text-foreground mb-2">Gérer les Routes</h4>
          <p className="text-sm text-muted-foreground">Ajouter, modifier ou supprimer des routes</p>
        </button>

        <button
          onClick={() => router.push('/dashboard/admin/tickets')}
          className="card-premium rounded-xl p-6 hover:shadow-lg transition-all group text-left"
        >
          <Ticket className="w-8 h-8 text-accent mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="text-lg font-semibold text-foreground mb-2">Gérer les Tickets</h4>
          <p className="text-sm text-muted-foreground">Voir et gérer tous les tickets</p>
        </button>

        <button
          onClick={() => router.push('/dashboard/admin/users')}
          className="card-premium rounded-xl p-6 hover:shadow-lg transition-all group text-left"
        >
          <Users className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="text-lg font-semibold text-foreground mb-2">Gérer les Utilisateurs</h4>
          <p className="text-sm text-muted-foreground">Administrer les comptes utilisateurs</p>
        </button>

        <button
          onClick={() => router.push('/dashboard/admin/cities')}
          className="card-premium rounded-xl p-6 hover:shadow-lg transition-all group text-left"
        >
          <Bus className="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="text-lg font-semibold text-foreground mb-2">Gérer les Villes</h4>
          <p className="text-sm text-muted-foreground">Configuration des villes et tarifs</p>
        </button>
      </div>
    </div>
  )
}
