'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Trash2, Clock, Ticket, MapPin, DollarSign, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  listNotifications,
  listAbonnementNotifications,
  type Notification,
  type AbonnementNotification,
} from "@/lib/api/notifications"
import { listUsers } from "@/lib/api/auth"
import { fetchCities } from "@/lib/api/cities"
import { fetchUserSubscriptions } from "@/lib/api/subscriptions"

// Enriched type for display
interface EnrichedAbonnementNotification extends AbonnementNotification {
  userName?: string
  cityName?: string
  priceInDhs?: number
}

export default function AdminNotificationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [ticketNotifications, setTicketNotifications] = useState<Notification[]>([])
  const [subscriptionNotifications, setSubscriptionNotifications] = useState<EnrichedAbonnementNotification[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [loadingSubs, setLoadingSubs] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!token || !isAdmin) {
      router.push("/login")
      return
    }

    const loadTickets = async () => {
      setLoadingTickets(true)
      try {
        const data = await listNotifications()
        setTicketNotifications(data)
      } catch (err) {
        console.error(err)
        toast({
          title: "Erreur",
          description: "Impossible de charger les notifications d'achat.",
          variant: "destructive",
        })
      } finally {
        setLoadingTickets(false)
      }
    }

    const loadSubs = async () => {
      setLoadingSubs(true)
      try {
        const [notifications, users] = await Promise.all([
          listAbonnementNotifications(),
          listUsers(true) // Force refresh to get latest users
        ])

        console.log('Subscription notifications:', notifications)
        console.log('Users:', users)

        // Fetch all user subscriptions
        const userIds = [...new Set(notifications.map(n => n.userId))]
        const allSubscriptionsPromises = userIds.map(userId => 
          fetchUserSubscriptions(userId).catch((err) => {
            console.error(`Error fetching subscriptions for user ${userId}:`, err)
            return []
          })
        )
        const allSubscriptionsArrays = await Promise.all(allSubscriptionsPromises)
        const allSubscriptions = allSubscriptionsArrays.flat()

        console.log('All subscriptions:', allSubscriptions)

        // Enrich notifications with user, city, and subscription data
        const enriched: EnrichedAbonnementNotification[] = notifications.map((notif) => {
          // Find user by id, username, or nom
          const user = users.find((u) => u.id === notif.userId)
          const subscription = allSubscriptions.find((s) => s.id === notif.abonnementId)
          
          console.log(`Notification ${notif.id}:`, {
            userId: notif.userId,
            abonnementId: notif.abonnementId,
            foundUser: user,
            foundSubscription: subscription,
            cityObject: subscription?.city
          })
          
          // Get username from various possible fields
          const userName = user?.username || user?.nom || user?.name || `User #${notif.userId}`
          
          // Subscription response has nested city object - try multiple field names
          const city = subscription?.city
          const cityName = city?.cityName || city?.nom || city?.name || city?.ville
          const priceInDhs = subscription
            ? subscription.type === 'MONTHLY'
              ? city?.monthlyPriceNormal
              : city?.yearlyPriceNormal
            : undefined

          return {
            ...notif,
            userName,
            cityName,
            priceInDhs,
          }
        })

        console.log('Enriched notifications:', enriched)
        setSubscriptionNotifications(enriched)
      } catch (err) {
        console.error(err)
        toast({
          title: "Erreur",
          description: "Impossible de charger les notifications d'abonnement.",
          variant: "destructive",
        })
      } finally {
        setLoadingSubs(false)
      }
    }

    loadTickets()
    loadSubs()
  }, [router, toast])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-header flex items-center gap-2">
          <Bell className="w-8 h-8" />
          Notifications
        </h1>
        <p className="section-description">
          Consultez toutes les notifications générées lors des achats et des abonnements.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Notifications d'achat de tickets</h2>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Actualiser
          </Button>
        </div>

        {loadingTickets ? (
          <div className="py-6 text-center text-muted-foreground">Chargement des notifications...</div>
        ) : ticketNotifications.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">Aucune notification d'achat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Utilisateur</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Ticket</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Trajet</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Ville</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Prix</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Date d'achat</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ticketNotifications.map((notif) => (
                  <tr key={notif.id} className="border-b border-border hover:bg-muted/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{notif.userName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">#{notif.ticketId}</span>
                      </div>
                      {notif.ticketDescription && (
                        <p className="text-xs text-muted-foreground mt-1">{notif.ticketDescription}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground font-medium">{notif.nomTrajet}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <MapPin className="w-3 h-3" />
                        {notif.cityName}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                        <DollarSign className="w-3 h-3" />
                        {notif.priceInDhs.toFixed(2)} DH
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(notif.achatCreatedAt).toLocaleString("fr-FR")}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Notifications d'abonnement</h2>

        {loadingSubs ? (
          <div className="py-6 text-center text-muted-foreground">Chargement des notifications...</div>
        ) : subscriptionNotifications.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">Aucune notification d'abonnement.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Utilisateur</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Ville</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Type</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Prix</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Date</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionNotifications.map((notif) => (
                  <tr key={notif.id} className="border-b border-border hover:bg-muted/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{notif.userName || "—"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {notif.cityName ? (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <MapPin className="w-3 h-3" />
                          {notif.cityName}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={notif.type === "MONTHLY" ? "default" : "secondary"}>
                        {notif.type === "MONTHLY" ? "Mensuel" : notif.type === "YEARLY" ? "Annuel" : notif.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {typeof notif.priceInDhs === "number" ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                          <DollarSign className="w-3 h-3" />
                          {notif.priceInDhs.toFixed(2)} DH
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {notif.receivedAt ? new Date(notif.receivedAt).toLocaleString("fr-FR") : "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

