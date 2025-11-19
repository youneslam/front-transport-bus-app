"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export default function TripsAnalysisTab() {
  const [selectedTrip, setSelectedTrip] = useState(0)

  const tripsByDay = [
    { day: "Mon", trips: 3 },
    { day: "Tue", trips: 4 },
    { day: "Wed", trips: 2 },
    { day: "Thu", trips: 5 },
    { day: "Fri", trips: 4 },
    { day: "Sat", trips: 1 },
    { day: "Sun", trips: 2 },
  ]

  const distanceData = [
    { month: "Jan", distance: 145 },
    { month: "Feb", distance: 168 },
    { month: "Mar", distance: 192 },
    { month: "Apr", distance: 156 },
    { month: "May", distance: 201 },
    { month: "Jun", distance: 178 },
  ]

  const routeUsage = [
    { name: "Route 42", value: 45, trips: 15 },
    { name: "Route 15", value: 28, trips: 8 },
    { name: "Route 7", value: 18, trips: 6 },
    { name: "Route 23", value: 9, trips: 3 },
  ]

  const recentTrips = [
    {
      id: 1,
      from: "Central Station",
      to: "Airport Terminal",
      date: "2024-01-15",
      time: "08:30 - 09:15",
      distance: "18.5 km",
      cost: "$8.50",
      route: "Route 42",
      status: "Completed",
    },
    {
      id: 2,
      from: "Downtown Hub",
      to: "University Campus",
      date: "2024-01-14",
      time: "14:20 - 15:05",
      distance: "12.3 km",
      cost: "$6.50",
      route: "Route 15",
      status: "Completed",
    },
    {
      id: 3,
      from: "Shopping District",
      to: "Residential Area",
      date: "2024-01-13",
      time: "17:45 - 18:30",
      distance: "9.8 km",
      cost: "$5.00",
      route: "Route 7",
      status: "Completed",
    },
  ]

  const COLORS = ["oklch(0.62 0.25 30)", "oklch(0.68 0.22 200)", "oklch(0.65 0.18 180)", "oklch(0.75 0.15 160)"]

  return (
    <div className="space-y-8">
      {/* Section Title */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Your Journey Analytics</h2>
        <p className="text-muted-foreground">Detailed insights into your transportation patterns and usage</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-1">Avg. Trip Duration</div>
          <div className="text-3xl font-bold text-primary">42 min</div>
          <div className="text-xs text-muted-foreground mt-2">↓ 8% from last month</div>
        </div>
        <div className="bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-1">Most Used Route</div>
          <div className="text-2xl font-bold text-accent">Route 42</div>
          <div className="text-xs text-muted-foreground mt-2">15 trips this month</div>
        </div>
        <div className="bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20 rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Distance</div>
          <div className="text-3xl font-bold">189 km</div>
          <div className="text-xs text-muted-foreground mt-2">↑ 12% from last month</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trips per Day */}
        <div className="card-premium rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Trip Frequency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tripsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="trips" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distance Trend */}
        <div className="card-premium rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Distance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={distanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="distance"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={{ fill: "var(--color-accent)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Route Usage Pie */}
        <div className="card-premium rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Route Usage Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={routeUsage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {routeUsage.map((entry, index) => (
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

        {/* Route Details */}
        <div className="card-premium rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Route Details</h3>
          <div className="space-y-3">
            {routeUsage.map((route) => (
              <div key={route.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-semibold">{route.name}</div>
                  <div className="text-sm text-muted-foreground">{route.trips} trips</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary">{route.value}%</div>
                  <div className="w-16 h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${route.value}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trips Detailed View */}
      <div className="card-premium rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Trips</h3>
        <div className="space-y-4">
          {recentTrips.map((trip, index) => (
            <div
              key={trip.id}
              className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setSelectedTrip(index)}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-sm font-semibold text-primary">{trip.route}</div>
                    <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{trip.status}</div>
                  </div>
                  <div className="font-semibold mb-1">
                    {trip.from} → {trip.to}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {trip.date} • {trip.time}
                  </div>
                </div>
                <div className="flex flex-col md:text-right gap-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Distance</div>
                    <div className="font-semibold">{trip.distance}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Cost</div>
                    <div className="font-semibold text-primary">{trip.cost}</div>
                  </div>
                </div>
              </div>
              {selectedTrip === index && (
                <div className="mt-4 pt-4 border-t border-border bg-muted/30 rounded p-3">
                  <div className="text-sm text-muted-foreground mb-2">Trip Details:</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Departure:</span>
                      <p className="font-semibold">{trip.time.split(" - ")[0]}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Arrival:</span>
                      <p className="font-semibold">{trip.time.split(" - ")[1]}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
