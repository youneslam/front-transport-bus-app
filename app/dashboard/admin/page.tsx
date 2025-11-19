"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { BarChart3, Users, Bus, TrendingUp, MapPin, AlertCircle, Activity, Clock, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  const revenueData = [
    { date: "Mon", revenue: 4200, trips: 124 },
    { date: "Tue", revenue: 3900, trips: 110 },
    { date: "Wed", revenue: 5200, trips: 145 },
    { date: "Thu", revenue: 4800, trips: 135 },
    { date: "Fri", revenue: 6200, trips: 165 },
    { date: "Sat", revenue: 7100, trips: 185 },
    { date: "Sun", revenue: 6500, trips: 175 },
  ]

  const busDistribution = [
    { name: "Active", value: 156, color: "#4f46e5" },
    { name: "Maintenance", value: 24, color: "#f59e0b" },
    { name: "Idle", value: 107, color: "#9ca3af" },
  ]

  const topRoutes = [
    { name: "Downtown → Airport", trips: 1250, revenue: 31250, occupancy: 92 },
    { name: "Central Hub → Mall", trips: 980, revenue: 14700, occupancy: 87 },
    { name: "University → Downtown", trips: 750, revenue: 6000, occupancy: 82 },
    { name: "Station → Harbor", trips: 620, revenue: 12400, occupancy: 85 },
  ]

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const admin = localStorage.getItem("isAdmin") === "true"

    if (!token || !admin) {
      router.push("/login")
      return
    }

    setIsAdmin(true)
  }, [router])

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="section-header">Admin Dashboard</h1>
        <p className="section-description">Monitor system performance, revenue, and fleet operations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card rounded-xl border-l-4 border-l-primary">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-primary mt-2">$38,000</p>
              <p className="text-xs text-primary/60 mt-2">This week</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary/20" />
          </div>
        </div>

        <div className="stat-card rounded-xl border-l-4 border-l-accent">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Active Users</p>
              <p className="text-3xl font-bold text-accent mt-2">12,450</p>
              <p className="text-xs text-accent/60 mt-2">+2.5% from last week</p>
            </div>
            <Users className="w-8 h-8 text-accent/20" />
          </div>
        </div>

        <div className="stat-card rounded-xl border-l-4 border-l-green-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Active Buses</p>
              <p className="text-3xl font-bold text-green-600 mt-2">287</p>
              <p className="text-xs text-green-600/60 mt-2">156 on routes</p>
            </div>
            <Bus className="w-8 h-8 text-green-500/20" />
          </div>
        </div>

        <div className="stat-card rounded-xl border-l-4 border-l-orange-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Daily Trips</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">1,039</p>
              <p className="text-xs text-orange-600/60 mt-2">Avg occupancy 87%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-500/20" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card-premium rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Weekly Revenue & Trips
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 220, 255, 0.15)" />
              <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground text-sm" />
              <YAxis stroke="currentColor" className="text-muted-foreground text-sm" />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
              <Legend />
              <Bar dataKey="revenue" fill="#4f46e5" name="Revenue ($)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="trips" fill="#06b6d4" name="Trips" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bus Distribution */}
        <div className="card-premium rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary" />
            Bus Status
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={busDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {busDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Health & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            System Performance
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Server Uptime</p>
                <p className="text-sm font-bold text-green-600">99.8%</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-accent h-2.5 rounded-full" style={{ width: "99.8%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">API Response Time</p>
                <p className="text-sm font-bold text-primary">45ms</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-accent to-primary h-2.5 rounded-full" style={{ width: "85%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Database Load</p>
                <p className="text-sm font-bold text-orange-600">62%</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-primary h-2.5 rounded-full" style={{ width: "62%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Cache Hit Rate</p>
                <p className="text-sm font-bold text-green-600">94%</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-primary h-2.5 rounded-full" style={{ width: "94%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card-premium rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            System Alerts
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors cursor-pointer">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">2 buses offline</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-200">Maintenance in progress</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Peak hours approaching</p>
                <p className="text-xs text-blue-700 dark:text-blue-200">Deploy extra capacity by 5 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">All systems operational</p>
                <p className="text-xs text-green-700 dark:text-green-200">No critical issues detected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Routes */}
      <div className="card-premium rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Top Performing Routes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Route</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Trips</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Revenue</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {topRoutes.map((route, idx) => (
                <tr key={idx} className="border-b border-border/40 hover:bg-muted/50 transition-colors group">
                  <td className="py-4 px-4 text-foreground font-medium group-hover:text-primary transition-colors">{route.name}</td>
                  <td className="py-4 px-4 text-right text-foreground font-semibold">{route.trips}</td>
                  <td className="py-4 px-4 text-right text-primary font-semibold">${route.revenue.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right">
                    <span className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary px-3 py-1.5 rounded-full text-sm font-semibold border border-primary/20">
                      {route.occupancy}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
