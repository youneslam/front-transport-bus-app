"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

export default function AdminDashboardTab() {
  const systemStats = [
    { label: "Active Users", value: "2,450", change: "+12%", color: "text-primary" },
    { label: "Total Buses", value: "156", change: "+2", color: "text-accent" },
    { label: "Daily Trips", value: "8,234", change: "+5.2%", color: "text-secondary" },
    { label: "Revenue Today", value: "$12,480", change: "+8.1%", color: "text-primary" },
  ]

  const dailyRevenue = [
    { day: "Mon", revenue: 11200 },
    { day: "Tue", revenue: 13450 },
    { day: "Wed", revenue: 10800 },
    { day: "Thu", revenue: 14200 },
    { day: "Fri", revenue: 15600 },
    { day: "Sat", revenue: 12300 },
    { day: "Sun", revenue: 9800 },
  ]

  const busUtilization = [
    { route: "Route 42", utilization: 92 },
    { route: "Route 15", utilization: 78 },
    { route: "Route 7", utilization: 65 },
    { route: "Route 23", utilization: 88 },
    { route: "Route 31", utilization: 72 },
  ]

  const userDistribution = [
    { name: "Premium", value: 35 },
    { name: "Monthly", value: 28 },
    { name: "Weekly", value: 22 },
    { name: "Daily", value: 15 },
  ]

  const topRoutes = [
    { route: "Route 42", passengers: 2450, revenue: "$3,125", rating: 4.8 },
    { route: "Route 15", passengers: 1890, revenue: "$2,410", rating: 4.6 },
    { route: "Route 7", passengers: 1650, revenue: "$1,895", rating: 4.5 },
    { route: "Route 23", passengers: 1420, revenue: "$1,680", rating: 4.7 },
  ]

  const COLORS = ["oklch(0.62 0.25 30)", "oklch(0.68 0.22 200)", "oklch(0.65 0.18 180)", "oklch(0.75 0.15 160)"]

  return (
    <div className="space-y-8">
      {/* Section Title */}
      <div>
        <h2 className="text-2xl font-bold mb-2">System Overview Dashboard</h2>
        <p className="text-muted-foreground">Real-time insights into all transport network operations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {systemStats.map((stat, index) => (
          <div key={index} className="card-premium rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
            <div className="text-xs text-green-600 font-semibold">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue */}
        <div className="card-premium rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
                formatter={(value) => `$${value}`}
              />
              <Bar dataKey="revenue" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bus Utilization */}
        <div className="card-premium rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Bus Route Utilization (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={busUtilization} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" stroke="var(--color-muted-foreground)" />
              <YAxis dataKey="route" type="category" stroke="var(--color-muted-foreground)" width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
                formatter={(value) => `${value}%`}
              />
              <Bar dataKey="utilization" fill="var(--color-accent)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Distribution */}
        <div className="card-premium rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Active Subscriptions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {userDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* System Health */}
        <div className="card-premium rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Server Uptime</span>
                <span className="text-sm text-green-600">99.8%</span>
              </div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "99.8%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Database Load</span>
                <span className="text-sm text-blue-600">45%</span>
              </div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "45%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">API Response Time</span>
                <span className="text-sm text-green-600">82ms</span>
              </div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "30%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Routes Table */}
      <div className="card-premium rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Top Performing Routes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Route</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Passengers</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Revenue</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Rating</th>
              </tr>
            </thead>
            <tbody>
              {topRoutes.map((route, index) => (
                <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-primary">{route.route}</td>
                  <td className="py-3 px-4">{route.passengers.toLocaleString()}</td>
                  <td className="py-3 px-4 font-semibold text-accent">{route.revenue}</td>
                  <td className="py-3 px-4">
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                      ⭐ {route.rating}
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
