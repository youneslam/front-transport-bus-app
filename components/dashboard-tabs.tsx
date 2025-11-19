"use client"

import { useState } from "react"
import SchedulesTab from "./tabs/schedules-tab"
import TicketsTab from "./tabs/tickets-tab"
import TrackingTab from "./tabs/tracking-tab"
import SubscriptionsTab from "./tabs/subscriptions-tab"
import ProfileTab from "./tabs/profile-tab"
import TripsAnalysisTab from "./tabs/trips-analysis-tab"
import AdminDashboardTab from "./tabs/admin-dashboard-tab"

interface DashboardTabsProps {
  isAdmin?: boolean
}

export default function DashboardTabs({ isAdmin = false }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "schedules" | "tickets" | "tracking" | "subscriptions" | "profile" | "trips-analysis" | "admin"
  >(isAdmin ? "admin" : "schedules")

  const userTabs = [
    { id: "schedules", label: "Bus Schedules", icon: "🚌" },
    { id: "tickets", label: "My Tickets", icon: "🎫" },
    { id: "trips-analysis", label: "Trip Analysis", icon: "📊" },
    { id: "tracking", label: "Live Tracking", icon: "📍" },
    { id: "subscriptions", label: "Subscriptions", icon: "🎁" },
    { id: "profile", label: "Profile", icon: "👤" },
  ]

  const adminTabs = [
    { id: "admin", label: "System Overview", icon: "📈" },
    { id: "schedules", label: "Bus Schedules", icon: "🚌" },
    { id: "tracking", label: "Live Tracking", icon: "📍" },
  ]

  const tabs = isAdmin ? adminTabs : userTabs

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium border-b-2 transition-all rounded-t-lg ${
              activeTab === tab.id
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card-premium rounded-lg p-6">
        {activeTab === "schedules" && <SchedulesTab />}
        {activeTab === "tickets" && <TicketsTab />}
        {activeTab === "tracking" && <TrackingTab />}
        {activeTab === "subscriptions" && <SubscriptionsTab />}
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "trips-analysis" && <TripsAnalysisTab />}
        {activeTab === "admin" && <AdminDashboardTab />}
      </div>
    </div>
  )
}
