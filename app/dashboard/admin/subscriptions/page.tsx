"use client"

import { useEffect } from "react"
import { useRouter } from 'next/navigation'
import { CreditCard, TrendingUp, Users } from 'lucide-react'

export default function AdminSubscriptionsPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!token || !isAdmin) {
      router.push("/login")
    }
  }, [router])

  const subscriptions = [
    { id: 1, name: "Daily Pass", price: 5, activeUsers: 2341, revenue: 11705, trend: "+12%" },
    { id: 2, name: "Weekly Pass", price: 25, activeUsers: 5682, revenue: 142050, trend: "+8%" },
    { id: 3, name: "Monthly Pass", price: 80, activeUsers: 8923, revenue: 713840, trend: "+15%" },
    { id: 4, name: "Annual Pass", price: 800, activeUsers: 1245, revenue: 996000, trend: "+22%" },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-header flex items-center gap-2">
          <CreditCard className="w-8 h-8" />
          Subscription Management
        </h1>
        <p className="section-description">Manage subscription plans and monitor revenue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="stat-card rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-primary mt-2">$1.86M</p>
            </div>
            <TrendingUp className="w-6 h-6 text-primary/40" />
          </div>
        </div>
        <div className="stat-card rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Active Users</p>
              <p className="text-3xl font-bold text-accent mt-2">18.2K</p>
            </div>
            <Users className="w-6 h-6 text-accent/40" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="card-premium rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{sub.name}</h3>
                <p className="text-2xl font-bold text-primary mt-2">${sub.price}</p>
              </div>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                {sub.trend}
              </span>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Subscribers</span>
                <span className="font-semibold text-foreground">{sub.activeUsers.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                <span className="font-semibold text-primary">${sub.revenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
