"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface Subscription {
  id: string
  name: string
  duration: string
  price: string
  trips: string
  features: string[]
  popular?: boolean
}

interface ActiveSubscription {
  planId: string
  planName: string
  startDate: string
  expiryDate: string
  status: "active" | "expiring" | "expired"
  autoRenew: boolean
  renewalDate?: string
}

export default function SubscriptionsTab() {
  const [activeTab, setActiveTab] = useState<"browse" | "manage">("browse")
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null)
  const [selectedForUpgrade, setSelectedForUpgrade] = useState<string | null>(null)
  const [showPaymentMethods, setShowPaymentMethods] = useState(false)

  // Load user's active subscription from localStorage
  useEffect(() => {
    const savedSubscription = localStorage.getItem("userSubscription")
    if (savedSubscription) {
      setActiveSubscription(JSON.parse(savedSubscription))
    }
  }, [])

  const subscriptions: Subscription[] = [
    {
      id: "daily",
      name: "Daily Pass",
      duration: "24 Hours",
      price: "$15",
      trips: "Unlimited",
      features: ["Unlimited trips for 24 hours", "All bus routes", "Mobile ticket"],
    },
    {
      id: "weekly",
      name: "Weekly Pass",
      duration: "7 Days",
      price: "$65",
      trips: "Unlimited",
      features: ["Unlimited trips for 7 days", "All bus routes", "Mobile ticket", "Priority boarding"],
      popular: true,
    },
    {
      id: "monthly",
      name: "Monthly Pass",
      duration: "30 Days",
      price: "$200",
      trips: "Unlimited",
      features: [
        "Unlimited trips for 30 days",
        "All bus routes",
        "Mobile ticket",
        "Priority boarding",
        "Free cancellation",
      ],
    },
    {
      id: "annual",
      name: "Annual Pass",
      duration: "365 Days",
      price: "$1,800",
      trips: "Unlimited",
      features: [
        "Unlimited trips for 365 days",
        "All bus routes",
        "Mobile ticket",
        "Priority boarding",
        "Free cancellation",
        "VIP support",
      ],
    },
  ]

  const getDaysRemaining = (expiryDate: string): number => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300"
      case "expiring":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "expired":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleSubscribePlan = (planId: string) => {
    const today = new Date()
    let expiryDate: Date

    // Calculate expiry date based on plan
    switch (planId) {
      case "daily":
        expiryDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
        break
      case "weekly":
        expiryDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case "monthly":
        expiryDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
      case "annual":
        expiryDate = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)
        break
      default:
        expiryDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }

    const planName = subscriptions.find((s) => s.id === planId)?.name || "Pass"
    const newSubscription: ActiveSubscription = {
      planId,
      planName,
      startDate: today.toISOString().split("T")[0],
      expiryDate: expiryDate.toISOString().split("T")[0],
      status: "active",
      autoRenew: true,
      renewalDate: expiryDate.toISOString().split("T")[0],
    }

    setActiveSubscription(newSubscription)
    localStorage.setItem("userSubscription", JSON.stringify(newSubscription))
    setActiveTab("manage")
  }

  const handleUpgradeDowngrade = (planId: string) => {
    handleSubscribePlan(planId)
    setSelectedForUpgrade(null)
  }

  const handleCancelSubscription = () => {
    localStorage.removeItem("userSubscription")
    setActiveSubscription(null)
    setActiveTab("browse")
  }

  const handleToggleAutoRenew = () => {
    if (activeSubscription) {
      const updated = {
        ...activeSubscription,
        autoRenew: !activeSubscription.autoRenew,
      }
      setActiveSubscription(updated)
      localStorage.setItem("userSubscription", JSON.stringify(updated))
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("browse")}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "browse"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Browse Plans
        </button>
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "manage"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Subscription
        </button>
      </div>

      {/* Browse Plans Tab */}
      {activeTab === "browse" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptions.map((sub) => (
              <Card
                key={sub.id}
                className={`p-6 relative transition-all flex flex-col ${
                  sub.popular ? "border-primary bg-primary/5 shadow-lg" : "hover:shadow-md"
                } ${activeSubscription?.planId === sub.id ? "ring-2 ring-accent" : ""}`}
              >
                {sub.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      POPULAR
                    </span>
                  </div>
                )}

                {activeSubscription?.planId === sub.id && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Current
                    </span>
                  </div>
                )}

                <h3 className="font-bold text-xl mb-2">{sub.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{sub.duration}</p>

                <div className="mb-6">
                  <p className="text-3xl font-bold">{sub.price}</p>
                  <p className="text-sm text-muted-foreground mt-1">{sub.trips} trips</p>
                </div>

                <ul className="space-y-2 mb-6 flex-grow">
                  {sub.features.map((feature, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-accent mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribePlan(sub.id)}
                  className={`w-full ${
                    activeSubscription?.planId === sub.id
                      ? "bg-accent hover:bg-accent/90"
                      : "bg-primary hover:bg-primary/90"
                  } text-primary-foreground`}
                >
                  {activeSubscription?.planId === sub.id ? "Current Plan" : "Subscribe"}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Manage Subscription Tab */}
      {activeTab === "manage" && (
        <div className="space-y-6">
          {activeSubscription ? (
            <>
              {/* Current Subscription Card */}
              <Card className="p-8 border-primary bg-primary/5">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">{activeSubscription.planName}</h2>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(activeSubscription.status)}`}
                    >
                      {activeSubscription.status.charAt(0).toUpperCase() + activeSubscription.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">Your active subscription details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Start Date</p>
                    <p className="font-semibold">{new Date(activeSubscription.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Expiry Date</p>
                    <p className="font-semibold">{new Date(activeSubscription.expiryDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Days Remaining</p>
                    <p className="font-bold text-lg text-accent">{getDaysRemaining(activeSubscription.expiryDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Auto-Renewal</p>
                    <p className="font-semibold">{activeSubscription.autoRenew ? "Enabled" : "Disabled"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleToggleAutoRenew}
                    variant="outline"
                    className={activeSubscription.autoRenew ? "border-accent text-accent" : ""}
                  >
                    {activeSubscription.autoRenew ? "Disable" : "Enable"} Auto-Renewal
                  </Button>
                  <Button variant="outline">Download Receipt</Button>
                  <Button
                    onClick={handleCancelSubscription}
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
                  >
                    Cancel Subscription
                  </Button>
                </div>
              </Card>

              {/* Upgrade/Downgrade Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Change Your Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {subscriptions.map((sub) => (
                    <Card
                      key={sub.id}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedForUpgrade === sub.id
                          ? "ring-2 ring-primary border-primary"
                          : "hover:shadow-md hover:border-primary"
                      } ${activeSubscription?.planId === sub.id ? "opacity-50" : ""}`}
                      onClick={() => activeSubscription?.planId !== sub.id && setSelectedForUpgrade(sub.id)}
                    >
                      <h4 className="font-bold">{sub.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{sub.duration}</p>
                      <p className="font-bold mb-3">{sub.price}</p>
                      {activeSubscription?.planId === sub.id && (
                        <p className="text-xs text-muted-foreground italic">Current plan</p>
                      )}
                    </Card>
                  ))}
                </div>
                {selectedForUpgrade && activeSubscription?.planId !== selectedForUpgrade && (
                  <Button
                    onClick={() => handleUpgradeDowngrade(selectedForUpgrade)}
                    className="w-full bg-accent hover:bg-accent/90"
                  >
                    Upgrade/Downgrade to Selected Plan
                  </Button>
                )}
              </div>

              {/* Payment Methods Section */}
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Payment Methods</h3>
                <div className="space-y-3 mb-4">
                  <div className="p-4 border rounded-lg flex items-center justify-between bg-muted/50">
                    <div>
                      <p className="font-semibold">Visa ending in 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/2026</p>
                    </div>
                    <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-1 rounded">Default</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  Add Payment Method
                </Button>
              </Card>

              {/* Subscription History */}
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-semibold">{activeSubscription.planName} Subscription</p>
                      <p className="text-sm text-muted-foreground">{activeSubscription.startDate}</p>
                    </div>
                    <p className="font-bold">{subscriptions.find((s) => s.id === activeSubscription.planId)?.price}</p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-6">No active subscription</p>
              <Button onClick={() => setActiveTab("browse")} className="bg-primary hover:bg-primary/90">
                Browse Plans
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
