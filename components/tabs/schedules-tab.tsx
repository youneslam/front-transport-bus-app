"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clock, Users } from "lucide-react"

interface BusSchedule {
  id: string
  route: string
  from: string
  to: string
  departure: string
  arrival: string
  price: number
  available: number
  duration: string
  type: "standard" | "premium"
}

export default function SchedulesTab() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [sortBy, setSortBy] = useState<"price" | "time">("price")

  const schedules: BusSchedule[] = [
    {
      id: "1",
      route: "Route 42",
      from: "Downtown Station",
      to: "Airport Terminal",
      departure: "08:00 AM",
      arrival: "08:45 AM",
      price: 12.5,
      available: 15,
      duration: "45 min",
      type: "standard",
    },
    {
      id: "2",
      route: "Express 7",
      from: "Downtown Station",
      to: "Airport Terminal",
      departure: "07:30 AM",
      arrival: "08:00 AM",
      price: 18.0,
      available: 8,
      duration: "30 min",
      type: "premium",
    },
    {
      id: "3",
      route: "Route 15",
      from: "Downtown Station",
      to: "Shopping Mall",
      departure: "08:30 AM",
      arrival: "09:15 AM",
      price: 10.0,
      available: 12,
      duration: "45 min",
      type: "standard",
    },
    {
      id: "4",
      route: "Route 42",
      from: "Downtown Station",
      to: "Airport Terminal",
      departure: "10:00 AM",
      arrival: "10:45 AM",
      price: 12.5,
      available: 20,
      duration: "45 min",
      type: "standard",
    },
  ]

  const sortedSchedules = [...schedules].sort((a, b) => {
    if (sortBy === "price") return a.price - b.price
    return a.departure.localeCompare(b.departure)
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">From</label>
          <Input placeholder="Starting point" defaultValue="Downtown Station" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">To</label>
          <Input placeholder="Destination" defaultValue="Airport Terminal" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Date</label>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button className="w-full bg-primary hover:bg-primary/90">Search</Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{sortedSchedules.length} buses found</p>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("price")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === "price" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}
          >
            Price
          </button>
          <button
            onClick={() => setSortBy("time")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === "time" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}
          >
            Time
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedSchedules.map((schedule) => (
          <Card key={schedule.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Departure</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg">{schedule.departure}</p>
                  {schedule.type === "premium" && (
                    <span className="bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-medium">
                      Premium
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Route</p>
                <p className="font-bold">{schedule.route}</p>
                <p className="text-xs text-muted-foreground mt-1">{schedule.from}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Duration</p>
                <p className="font-semibold flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {schedule.duration}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Arrival</p>
                <p className="font-semibold">{schedule.arrival}</p>
                <p className="text-xs text-muted-foreground mt-1">{schedule.to}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Available</p>
                <p className="font-bold text-lg flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {schedule.available}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">${schedule.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">per seat</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full md:w-auto">
                  Book
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
