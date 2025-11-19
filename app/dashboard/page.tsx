"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { ArrowUpRight, TrendingUp, Zap, Award } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")

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
              <p className="text-sm text-muted-foreground font-medium">Total Trips</p>
              <p className="text-3xl font-bold text-primary mt-2">24</p>
              <p className="text-xs text-muted-foreground mt-2">5 trips this month</p>
            </div>
            <TrendingUp className="w-6 h-6 text-primary/40" />
          </div>
        </div>

        <div className="stat-card rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Active Pass</p>
              <p className="text-2xl font-bold text-accent mt-2">Monthly Pass</p>
              <p className="text-xs text-muted-foreground mt-2">18 days remaining</p>
            </div>
            <Zap className="w-6 h-6 text-accent/40" />
          </div>
        </div>

        <div className="stat-card rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Amount Saved</p>
              <p className="text-3xl font-bold text-primary mt-2">$247</p>
              <p className="text-xs text-muted-foreground mt-2">vs single tickets</p>
            </div>
            <ArrowUpRight className="w-6 h-6 text-primary/40" />
          </div>
        </div>

        <div className="stat-card rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Reward Points</p>
              <p className="text-3xl font-bold text-accent mt-2">1,250</p>
              <p className="text-xs text-muted-foreground mt-2">Redeemable</p>
            </div>
            <Award className="w-6 h-6 text-accent/40" />
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
