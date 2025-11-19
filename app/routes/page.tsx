"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Clock, Users, TrendingDown } from "lucide-react"

interface Bus {
  id: string
  route: string
  operator: string
  from: string
  to: string
  departure: string
  arrival: string
  duration: string
  price: number
  seats: number
  type: "standard" | "premium"
  rating: number
  amenities: string[]
}

export default function RoutesPage() {
  const router = useRouter()
  const [from, setFrom] = useState("Downtown Station")
  const [to, setTo] = useState("Airport Terminal")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [sortBy, setSortBy] = useState<"price" | "departure" | "duration">("price")
  const [filterType, setFilterType] = useState<"all" | "standard" | "premium">("all")

  const buses: Bus[] = [
    {
      id: "1",
      route: "Route 42 Express",
      operator: "UrbanBus Co",
      from: "Downtown Station",
      to: "Airport Terminal",
      departure: "08:00 AM",
      arrival: "08:45 AM",
      duration: "45 min",
      price: 12.5,
      seats: 15,
      type: "standard",
      rating: 4.5,
      amenities: ["WiFi", "USB Charging"],
    },
    {
      id: "2",
      route: "Premium Route 15",
      operator: "LuxBus",
      from: "Downtown Station",
      to: "Airport Terminal",
      departure: "07:30 AM",
      arrival: "08:00 AM",
      duration: "30 min",
      price: 18.0,
      seats: 8,
      type: "premium",
      rating: 4.8,
      amenities: ["WiFi", "USB Charging", "Refreshments", "Reclining Seats"],
    },
    {
      id: "3",
      route: "Route 15",
      operator: "CityTransit",
      from: "Downtown Station",
      to: "Airport Terminal",
      departure: "08:30 AM",
      arrival: "09:15 AM",
      duration: "45 min",
      price: 10.0,
      seats: 20,
      type: "standard",
      rating: 4.2,
      amenities: ["USB Charging"],
    },
    {
      id: "4",
      route: "Route 42 Express",
      operator: "UrbanBus Co",
      from: "Downtown Station",
      to: "Airport Terminal",
      departure: "09:00 AM",
      arrival: "09:45 AM",
      duration: "45 min",
      price: 12.5,
      seats: 12,
      type: "standard",
      rating: 4.5,
      amenities: ["WiFi", "USB Charging"],
    },
    {
      id: "5",
      route: "Route 7 Ultra Express",
      operator: "FastBus",
      from: "Downtown Station",
      to: "Airport Terminal",
      departure: "09:30 AM",
      arrival: "09:50 AM",
      duration: "20 min",
      price: 25.0,
      seats: 5,
      type: "premium",
      rating: 4.9,
      amenities: ["WiFi", "USB Charging", "Premium Seating", "Complimentary Snacks"],
    },
    {
      id: "6",
      route: "Route 42 Express",
      operator: "UrbanBus Co",
      from: "Downtown Station",
      to: "Airport Terminal",
      departure: "10:00 AM",
      arrival: "10:45 AM",
      duration: "45 min",
      price: 12.5,
      seats: 18,
      type: "standard",
      rating: 4.5,
      amenities: ["WiFi", "USB Charging"],
    },
  ]

  const filteredBuses = buses
    .filter((bus) => filterType === "all" || bus.type === filterType)
    .sort((a, b) => {
      if (sortBy === "price") return a.price - b.price
      if (sortBy === "departure") return a.departure.localeCompare(b.departure)
      if (sortBy === "duration") {
        const aDuration = Number.parseInt(a.duration)
        const bDuration = Number.parseInt(b.duration)
        return aDuration - bDuration
      }
      return 0
    })

  const handleSearch = () => {
    // Search logic
  }

  const handleBooking = (busId: string) => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/login")
    } else {
      router.push(`/booking/${busId}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-gradient-to-b from-primary/5 to-transparent py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Find Your Journey</h1>
          <p className="text-muted-foreground text-lg mb-8">Book affordable, convenient bus tickets for your travels</p>

          {/* Search Panel */}
          <Card className="p-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">From</label>
                <Input
                  placeholder="Starting point"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                <Input
                  placeholder="Destination"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6"
                >
                  Search Buses
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <Card className="p-6 sticky top-24">
              <h3 className="font-bold text-lg mb-4">Filters</h3>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Bus Type</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      filterType === "all" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    All Buses
                  </button>
                  <button
                    onClick={() => setFilterType("standard")}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      filterType === "standard" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setFilterType("premium")}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      filterType === "premium" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    Premium
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Sort By</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSortBy("price")}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      sortBy === "price" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    Price (Low to High)
                  </button>
                  <button
                    onClick={() => setSortBy("departure")}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      sortBy === "departure" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Earliest Departure
                  </button>
                  <button
                    onClick={() => setSortBy("duration")}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      sortBy === "duration" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Shortest Duration
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Results List */}
          <div className="flex-1">
            <div className="mb-4 text-sm text-muted-foreground">Showing {filteredBuses.length} available buses</div>

            <div className="space-y-4">
              {filteredBuses.map((bus) => (
                <Card key={bus.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-start">
                    {/* Route Info */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-lg">{bus.departure}</p>
                            {bus.type === "premium" && (
                              <span className="bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-medium">
                                Premium
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{bus.from}</p>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {bus.duration}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Arrival */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Arrival</p>
                      <p className="font-semibold">{bus.arrival}</p>
                      <p className="text-sm text-muted-foreground mt-2">{bus.to}</p>
                    </div>

                    {/* Route & Rating */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Route</p>
                      <p className="font-semibold mb-2">{bus.route}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        ★ {bus.rating.toFixed(1)} • {bus.operator}
                      </p>
                    </div>

                    {/* Availability */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Available</p>
                      <p className="font-bold text-lg flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {bus.seats}
                      </p>
                      <p className="text-xs text-green-600 mt-2">Seats available</p>
                    </div>

                    {/* Price & Action */}
                    <div className="flex flex-col items-end justify-between">
                      <div className="text-right mb-4">
                        <p className="text-2xl font-bold text-accent">${bus.price.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">per ticket</p>
                      </div>
                      <Button
                        onClick={() => handleBooking(bus.id)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>

                  {/* Amenities */}
                  {bus.amenities.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Amenities:</p>
                      <div className="flex flex-wrap gap-2">
                        {bus.amenities.map((amenity, idx) => (
                          <span key={idx} className="bg-muted px-3 py-1 rounded-full text-xs">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
