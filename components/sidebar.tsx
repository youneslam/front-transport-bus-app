"use client"

import Link from "next/link"
import { usePathname, useRouter } from 'next/navigation'
import { useState } from "react"
import { LayoutDashboard, TrendingUp, Map, Ticket, CreditCard, User, LogOut, Menu, X, BarChart3, ChevronLeft, ChevronRight, Users, Bus, MapPin, Mail, Building2 } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

export default function Sidebar({ isAdmin, userName }: { isAdmin: boolean; userName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const navItems: NavItem[] = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "My Trips",
      href: "/dashboard/trips",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: "Book Ticket",
      href: "/dashboard/booking",
      icon: <Ticket className="w-5 h-5" />,
    },
    {
      label: "Track Bus",
      href: "/dashboard/tracking",
      icon: <Map className="w-5 h-5" />,
    },
    {
      label: "Subscriptions",
      href: "/dashboard/subscriptions",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      label: "Profile",
      href: "/dashboard/profile",
      icon: <User className="w-5 h-5" />,
    },
    ...(isAdmin
      ? [
          {
            label: "Admin Dashboard",
            href: "/dashboard/admin",
            icon: <BarChart3 className="w-5 h-5" />,
            adminOnly: true,
          },
          {
            label: "Users",
            href: "/dashboard/admin/users",
            icon: <Users className="w-5 h-5" />,
            adminOnly: true,
          },
          {
            label: "Buses",
            href: "/dashboard/admin/buses",
            icon: <Bus className="w-5 h-5" />,
            adminOnly: true,
          },
          {
            label: "Routes",
            href: "/dashboard/admin/routes",
            icon: <Map className="w-5 h-5" />,
            adminOnly: true,
          },
          {
            label: "Cities",
            href: "/dashboard/admin/cities",
            icon: <Building2 className="w-5 h-5" />,
            adminOnly: true,
          },
          {
            label: "Stations",
            href: "/dashboard/admin/stations",
            icon: <MapPin className="w-5 h-5" />,
            adminOnly: true,
          },
          {
            label: "Tickets",
            href: "/dashboard/admin/tickets",
            icon: <Ticket className="w-5 h-5" />,
            adminOnly: true,
          },
          {
            label: "Subscription Cities",
            href: "/dashboard/admin/subscription-cities",
            icon: <Building2 className="w-5 h-5" />,
            adminOnly: true,
          },
          {
            label: "Notifications",
            href: "/dashboard/admin/notifications",
            icon: <Mail className="w-5 h-5" />,
            adminOnly: true,
          },
        ]
      : []),
  ]

  const visibleItems = navItems.filter((item) => {
    // adminOnly items uniquement pour admin
    if (item.adminOnly) {
      return isAdmin
    }
    // items "passager" uniquement si pas admin
    return !isAdmin
  })

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userName")
    localStorage.removeItem("isAdmin")
    router.push("/login")
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-40 md:hidden bg-primary text-white p-2 rounded-lg"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 transform md:translate-x-0 flex flex-col ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${isExpanded ? "w-64 md:w-64" : "w-20 md:w-20"}`}
      >
        {/* Logo and Expand Toggle */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <Link href="/" className={`flex items-center gap-3 transition-all ${!isExpanded && "md:justify-center md:w-full"}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-sidebar-primary to-sidebar-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground font-bold text-lg">U</span>
            </div>
            {(isExpanded || isMobileOpen) && (
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">UrbanGo</h1>
                <p className="text-xs text-sidebar-foreground/60">Transport Hub</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden md:block p-1 hover:bg-sidebar-border rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            {isExpanded ? (
              <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-sidebar-foreground" />
            )}
          </button>
        </div>

        {/* User Info */}
        {(isExpanded || isMobileOpen) && (
          <div className="p-4 border-b border-sidebar-border">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{userName}</p>
            <p className="text-xs text-sidebar-foreground/60">{isAdmin ? "Admin Account" : "User Account"}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-border"
                } ${!isExpanded && "md:justify-center md:px-3"}`}
                title={!isExpanded ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {(isExpanded || isMobileOpen) && (
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-destructive/20 transition-colors duration-200 ${!isExpanded && "md:justify-center md:px-3"}`}
            title={!isExpanded ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(isExpanded || isMobileOpen) && (
              <span className="font-medium whitespace-nowrap">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Close sidebar on mobile when clicking outside */}
      {isMobileOpen && <div className="fixed inset-0 z-20 md:hidden" onClick={() => setIsMobileOpen(false)} />}
    </>
  )
}
