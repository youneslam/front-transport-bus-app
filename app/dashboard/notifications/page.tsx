"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from 'next/navigation'
import { Bell, Ticket, CreditCard, Calendar, Filter, X } from 'lucide-react'
import { listNotifications, listAbonnementNotifications, Notification, AbonnementNotification } from '@/lib/api/notifications'
import { fetchUserSubscriptions, SubscriptionPurchaseResponse, fetchSubscriptionCities, SubscriptionCity } from '@/lib/api/subscriptions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type EnrichedAbonnementNotification = AbonnementNotification & {
  subscription?: SubscriptionPurchaseResponse
}

type CombinedNotification = 
  | (Notification & { notificationType: 'ticket' })
  | (EnrichedAbonnementNotification & { notificationType: 'abonnement' })

export default function NotificationsPage() {
  const router = useRouter()
  const [ticketNotifications, setTicketNotifications] = useState<Notification[]>([])
  const [abonnementNotifications, setAbonnementNotifications] = useState<EnrichedAbonnementNotification[]>([])
  const [subscriptionCities, setSubscriptionCities] = useState<SubscriptionCity[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'ticket' | 'abonnement'>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!token) {
      router.push("/login")
      return
    }
    if (isAdmin) {
      router.push("/dashboard/admin")
      return
    }

    const load = async () => {
      setLoading(true)
      try {
        const userId = typeof window !== "undefined" ? Number(localStorage.getItem('userId') || '1') : 1
        const [tickets, abonnements, userSubscriptions, cities] = await Promise.all([
          listNotifications(),
          listAbonnementNotifications(),
          fetchUserSubscriptions(userId),
          fetchSubscriptionCities(),
        ])
        
        console.log('User subscriptions:', userSubscriptions)
        console.log('Abonnement notifications:', abonnements)
        console.log('Subscription cities:', cities)
        
        setSubscriptionCities(cities || [])
        
        // Enrich abonnement notifications with full subscription data
        const enrichedAbonnements: EnrichedAbonnementNotification[] = (abonnements || []).map(notif => {
          // The notification already has abonnementId, so we can match it directly
          const subscription = userSubscriptions.find(sub => sub.id === notif.abonnementId)
          console.log('Notification:', notif.id, 'AbonnementId:', notif.abonnementId, 'Found subscription:', subscription?.id, 'City:', subscription?.city)
          return { ...notif, subscription }
        })
        
        setTicketNotifications(tickets || [])
        setAbonnementNotifications(enrichedAbonnements)
      } catch (error) {
        console.error("Error loading notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  // Combine and sort notifications
  const combinedNotifications = useMemo((): CombinedNotification[] => {
    const tickets: CombinedNotification[] = ticketNotifications.map(n => ({ ...n, notificationType: 'ticket' as const }))
    const abonnements: CombinedNotification[] = abonnementNotifications.map(n => ({ ...n, notificationType: 'abonnement' as const }))
    
    const all = [...tickets, ...abonnements]
    
    // Sort by date (newest first)
    return all.sort((a, b) => {
      const dateA = a.notificationType === 'ticket' 
        ? new Date(a.achatCreatedAt) 
        : new Date(a.receivedAt)
      const dateB = b.notificationType === 'ticket' 
        ? new Date(b.achatCreatedAt) 
        : new Date(b.receivedAt)
      return dateB.getTime() - dateA.getTime()
    })
  }, [ticketNotifications, abonnementNotifications])

  // Apply filters
  const filteredNotifications = useMemo(() => {
    return combinedNotifications.filter(notification => {
      // Type filter
      if (typeFilter !== 'all' && notification.notificationType !== typeFilter) return false

      // Get notification date
      const notifDate = notification.notificationType === 'ticket' 
        ? new Date(notification.achatCreatedAt)
        : new Date(notification.receivedAt)

      // Specific date filter
      if (dateFilter) {
        const filterDate = new Date(dateFilter)
        filterDate.setHours(0, 0, 0, 0)
        const notifDateOnly = new Date(notifDate)
        notifDateOnly.setHours(0, 0, 0, 0)
        if (notifDateOnly.getTime() !== filterDate.getTime()) return false
      }

      // Period filter
      if (periodFilter !== 'all') {
        const now = new Date()
        const dayInMs = 24 * 60 * 60 * 1000

        if (periodFilter === 'today') {
          const todayStart = new Date(now)
          todayStart.setHours(0, 0, 0, 0)
          if (notifDate < todayStart) return false
        } else if (periodFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * dayInMs)
          if (notifDate < weekAgo) return false
        } else if (periodFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * dayInMs)
          if (notifDate < monthAgo) return false
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (notification.notificationType === 'ticket') {
          const matchesTrajet = notification.nomTrajet?.toLowerCase().includes(query)
          const matchesCity = notification.cityName?.toLowerCase().includes(query)
          const matchesUser = notification.userName?.toLowerCase().includes(query)
          if (!matchesTrajet && !matchesCity && !matchesUser) return false
        } else {
          const matchesCity = notification.subscription?.city?.name?.toLowerCase().includes(query)
          const matchesType = notification.type?.toLowerCase().includes(query)
          if (!matchesCity && !matchesType) return false
        }
      }

      return true
    })
  }, [combinedNotifications, typeFilter, dateFilter, periodFilter, searchQuery])

  // Statistics
  const stats = useMemo(() => {
    const total = filteredNotifications.length
    const tickets = filteredNotifications.filter(n => n.notificationType === 'ticket').length
    const abonnements = filteredNotifications.filter(n => n.notificationType === 'abonnement').length
    const totalAmount = filteredNotifications.reduce((sum, n) => {
      if (n.notificationType === 'ticket') {
        return sum + (n.priceInDhs || 0)
      } else {
        // For subscriptions, check the notification's type field (MONTHLY/YEARLY)
        const subscriptionType = n.type // This is MONTHLY or YEARLY from AbonnementNotification
        const price = subscriptionType === 'MONTHLY'
          ? (n.subscription?.city?.monthlyPriceNormal || 0)
          : (n.subscription?.city?.yearlyPriceNormal || 0)
        return sum + price
      }
    }, 0)

    return { total, tickets, abonnements, totalAmount }
  }, [filteredNotifications])

  const clearFilters = () => {
    setTypeFilter('all')
    setDateFilter('')
    setPeriodFilter('all')
    setSearchQuery('')
  }

  const hasActiveFilters = typeFilter !== 'all' || dateFilter !== '' || periodFilter !== 'all' || searchQuery !== ''

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-muted-foreground">Loading notifications...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Notifications</h1>
          </div>
          <p className="text-muted-foreground">View all your ticket and subscription notifications</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                <div className="text-3xl font-bold text-foreground">{stats.tickets}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <div className="text-3xl font-bold text-foreground">{stats.abonnements}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalAmount.toFixed(2)} DH</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-premium mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Type</label>
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="ticket">Tickets</SelectItem>
                    <SelectItem value="abonnement">Subscriptions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Period Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Period</label>
                <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Specific Date Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Specific Date</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Search */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Search</label>
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="card-premium">
              <CardContent className="py-12 text-center">
                <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">No notifications found</p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
              {filteredNotifications.map((notification) => (
                <Card key={`${notification.notificationType}-${notification.id}`} className="card-premium hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        <div className={`p-3 rounded-xl ${notification.notificationType === 'ticket' ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                          {notification.notificationType === 'ticket' ? (
                            <Ticket className="w-6 h-6 text-blue-600" />
                          ) : (
                            <CreditCard className="w-6 h-6 text-green-600" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={notification.notificationType === 'ticket' ? 'default' : 'secondary'}>
                              {notification.notificationType === 'ticket' ? 'Ticket' : 'Subscription'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {notification.notificationType === 'ticket' 
                                ? new Date(notification.achatCreatedAt).toLocaleString()
                                : new Date(notification.receivedAt).toLocaleString()
                              }
                            </span>
                          </div>

                          {notification.notificationType === 'ticket' ? (
                            <>
                              <h3 className="font-semibold text-foreground mb-1">
                                Ticket Purchase - {notification.nomTrajet}
                              </h3>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>User: {notification.userName}</p>
                                <p>City: {notification.cityName}</p>
                                {notification.ticketDescription && <p>Description: {notification.ticketDescription}</p>}
                                <p>Achat ID: #{notification.achatId}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <h3 className="font-semibold text-foreground mb-1">
                                Subscription Purchase {notification.subscription?.city?.name ? `- ${notification.subscription.city.name}` : ''}
                              </h3>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Subscription ID: #{notification.abonnementId}</p>
                                <p>Type: {notification.type}</p>
                                <p>Start: {new Date(notification.startDate).toLocaleDateString()}</p>
                                <p>End: {new Date(notification.endDate).toLocaleDateString()}</p>
                                {notification.subscription && (
                                  <>
                                    <p>City: {notification.subscription.city?.name || 'Unknown'}</p>
                                    <p>Status: {notification.subscription.active ? 'Active' : 'Inactive'}</p>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">
                          {notification.notificationType === 'ticket'
                            ? (notification.priceInDhs?.toFixed(2) || '0.00')
                            : notification.subscription
                              ? (notification.type === 'MONTHLY' 
                                  ? (notification.subscription.city?.monthlyPriceNormal?.toFixed(2) || '0.00')
                                  : (notification.subscription.city?.yearlyPriceNormal?.toFixed(2) || '0.00'))
                              : '0.00'
                          } DH
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
