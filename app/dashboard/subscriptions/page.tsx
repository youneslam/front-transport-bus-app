"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import {
  fetchSubscriptionCities,
  fetchSubscriptionForCity,
  SubscriptionCity,
  purchaseSubscription,
  SubscriptionPurchaseResponse,
  fetchCurrentSubscription,
  cancelSubscription,
} from '@/lib/api/subscriptions'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function daysBetween(a: Date, b: Date) {
  const diff = b.getTime() - a.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function SubscriptionStatusCard({ subscription }: { subscription: SubscriptionPurchaseResponse }) {
  const now = new Date()
  const start = new Date(subscription.startDate)
  const end = new Date(subscription.endDate)
  let status = 'Expired'
  if (now < start) status = 'Upcoming'
  else if (now >= start && now <= end) status = 'Active'

  const daysLeft = daysBetween(now, end)

  return (
    <div>
      <div className="font-semibold">{status}</div>
      <div className="text-sm text-muted-foreground mt-2">
        {status === 'Active' && <span>{daysLeft} jour(s) restants</span>}
        {status === 'Upcoming' && <span>Démarre dans {daysBetween(now, start)} jour(s)</span>}
        {status === 'Expired' && <span>Expiré</span>}
      </div>
    </div>
  )
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const [cities, setCities] = useState<SubscriptionCity[]>([])
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [selectedCity, setSelectedCity] = useState<SubscriptionCity | null>(null)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const { toast } = useToast()
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionPurchaseResponse | null>(null)

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
  }, [router])

  useEffect(() => {
    const load = async () => {
      setLoadingCities(true)
      setError(null)
      try {
        const res = await fetchSubscriptionCities()
        console.log('Villes d\'abonnement récupérées:', res) // Debug
        if (res && Array.isArray(res) && res.length > 0) {
          setCities(res)
          setSelectedCityId(res[0].id)
        } else {
          setCities([])
          setError("Aucune ville d'abonnement disponible")
        }

        const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || '1') : 1
        const current = await fetchCurrentSubscription(userId).catch(() => null)
        if (current) setCurrentSubscription(current)
      } catch (err) {
        console.error('Erreur lors du chargement des villes:', err)
        setError("Impossible de récupérer les villes d'abonnement")
        setCities([])
      } finally {
        setLoadingCities(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (selectedCityId == null) return
    const loadDetails = async () => {
      setLoadingDetails(true)
      setError(null)
      try {
        const details = await fetchSubscriptionForCity(selectedCityId)
        setSelectedCity(details)
      } catch (err) {
        setError("Impossible de récupérer les infos d'abonnement pour la ville sélectionnée")
      } finally {
        setLoadingDetails(false)
      }
    }
    loadDetails()
  }, [selectedCityId])

  // Check if user has an active subscription for the selected city
  const isBlockedForCity = Boolean(
    currentSubscription && 
    selectedCity && 
    currentSubscription.city?.id === selectedCity.id &&
    currentSubscription.active === true
  )

  const handlePurchase = async (type: 'MONTHLY' | 'YEARLY') => {
    if (!selectedCity) return
    try {
      setIsPurchasing(true)
      const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || '1') : 1
      
      // Redirect to payment page WITHOUT creating subscription yet
      // The subscription will be created after successful payment
      const amount = type === 'MONTHLY' ? selectedCity.monthlyPriceNormal : selectedCity.yearlyPriceNormal
      const params = new URLSearchParams({
        type: 'ABONNEMENT',
        cityId: String(selectedCity.id),
        subscriptionType: type,
        amount: String(amount),
        userId: String(userId),
      })
      router.push(`/payment?${params.toString()}`)
    } catch (e) {
      toast({ title: 'Erreur', description: 'Impossible de procéder au paiement' })
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return
    try {
      const res = await cancelSubscription(currentSubscription.id)
      if (res.success) {
        setCurrentSubscription(null)
        toast({
          title: 'Succès',
          description: 'Votre abonnement a été annulé avec succès.',
        })
      } else {
        toast({
          title: 'Erreur',
          description: res.message || 'Impossible d\'annuler l\'abonnement',
          variant: 'destructive',
        })
      }
    } catch (e) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'annulation',
        variant: 'destructive',
      })
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-header">Abonnements</h1>
        <p className="section-description">Sélectionnez votre ville puis choisissez l'abonnement souhaité</p>
      </div>

      {currentSubscription && currentSubscription.active && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Votre abonnement actif</h2>
          <div className="card-premium rounded-xl p-6 border-2 border-primary/40 relative overflow-hidden">
            {/* Active badge */}
            <div className="absolute top-0 right-0 bg-linear-to-r from-primary to-accent text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
              ✓ Actif
            </div>

            {/* Gradient background */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-accent/5 opacity-50" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{currentSubscription.type === 'MONTHLY' ? 'Abonnement Mensuel' : 'Abonnement Annuel'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Pour {currentSubscription.city?.name}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Check className="w-5 h-5 text-primary" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground font-medium">Date de début</div>
                  <div className="text-sm font-semibold mt-1">{new Date(currentSubscription.startDate).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground font-medium">Date de fin</div>
                  <div className="text-sm font-semibold mt-1">{new Date(currentSubscription.endDate).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-xs text-muted-foreground font-medium">Jours restants</div>
                  <div className="text-sm font-bold text-primary mt-1">
                    {(() => {
                      const now = new Date()
                      const end = new Date(currentSubscription.endDate)
                      const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                      return daysLeft > 0 ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''}` : 'Expiré'
                    })()}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                {(() => {
                  const now = new Date()
                  const start = new Date(currentSubscription.startDate)
                  const end = new Date(currentSubscription.endDate)
                  const total = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
                  const passed = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
                  const pct = Math.min(100, Math.max(0, Math.round((passed / total) * 100)))

                  return (
                    <div>
                      <div className="w-full bg-border rounded-full h-2 overflow-hidden mb-2">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-2 bg-linear-to-r from-primary to-accent transition-all duration-300"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {passed} / {total} jour(s) écoulé(s) • {Math.max(0, total - passed)} jour(s) restants
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 text-sm text-foreground mb-4">
                <span className="font-semibold text-primary">✓ Abonnement actif</span> — Vous pouvez voyager en illimité
              </div>

              {/* Cancel Button with Confirmation */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full mt-2 py-2.5 px-4 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <X className="w-4 h-4" />
                    Annuler l'abonnement
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir annuler votre abonnement ? Cette action est irréversible et vous perdrez l'accès aux avantages de l'abonnement.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Non, garder mon abonnement</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Oui, annuler l'abonnement
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">{error}</div>}

      {/* City Selection - Dropdown List */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Sélectionnez une ville</h2>
        <select
          value={selectedCityId || ''}
          onChange={(e) => setSelectedCityId(e.target.value ? Number(e.target.value) : null)}
          disabled={loadingCities || loadingDetails}
          className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Sélectionnez une ville...</option>
          {loadingCities ? (
            <option value="" disabled>Chargement des villes...</option>
          ) : cities.length === 0 ? (
            <option value="" disabled>Aucune ville disponible</option>
          ) : (
            cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))
          )}
        </select>
        {loadingCities && (
          <p className="text-sm text-muted-foreground mt-2">Chargement des villes...</p>
        )}
        {!loadingCities && cities.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">Aucune ville disponible</p>
        )}
      </div>

      {/* Offers Display */}
      {loadingDetails ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-muted-foreground">Chargement des informations d'abonnement…</div>
        </div>
      ) : selectedCity ? (
        <div>
          <h2 className="text-xl font-bold mb-6">Offres disponibles pour {selectedCity.name}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Card */}
            <div className="card-premium rounded-xl p-6 border-2 border-transparent hover:border-primary/30 transition-all duration-200 relative overflow-hidden group">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Abonnement Mensuel</h3>
                    <p className="text-sm text-muted-foreground mt-1">Accès illimité tous les mois</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-4xl font-bold text-primary mb-1">{selectedCity.monthlyPriceNormal} Dhs</div>
                  <div className="text-sm text-muted-foreground">par mois</div>
                </div>

                <ul className="mb-8 space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>Accès illimité à tous les trajets</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>Toutes les lignes incluses</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>Support client standard</span>
                  </li>
                </ul>

                {isBlockedForCity ? (
                  <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                    <div className="font-semibold mb-1">Abonnement actif existant</div>
                    Vous avez déjà un abonnement actif pour {selectedCity.name}. Un nouvel abonnement désactivera automatiquement l'ancien.
                  </div>
                ) : (
                  <button
                    className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handlePurchase('MONTHLY')}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? 'Traitement...' : 'Acheter (mensuel)'}
                  </button>
                )}
              </div>
            </div>

            {/* Yearly Card (Featured) */}
            <div className="card-premium rounded-xl p-6 border-2 border-accent/40 relative overflow-hidden group shadow-lg">
              {/* Featured badge */}
              <div className="absolute top-0 right-0 bg-linear-to-r from-accent to-primary text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                Meilleure Offre
              </div>

              {/* Gradient background */}
              <div className="absolute inset-0 bg-linear-to-br from-accent/10 to-primary/10 opacity-100" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Abonnement Annuel</h3>
                    <p className="text-sm text-muted-foreground mt-1">Accès illimité toute l'année</p>
                  </div>
                  <div className="p-2 bg-accent/10 rounded-full">
                    <Check className="w-5 h-5 text-accent" />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-4xl font-bold text-accent mb-1">{selectedCity.yearlyPriceNormal} Dhs</div>
                  <div className="text-sm text-muted-foreground">par an</div>
                  <div className="text-xs text-accent/70 mt-2">
                    Équivalent à {Math.round(selectedCity.yearlyPriceNormal / 12)} Dhs / mois
                  </div>
                </div>

                <ul className="mb-8 space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>Accès illimité à tous les trajets</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>Toutes les lignes incluses</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>Support client prioritaire</span>
                  </li>
                </ul>

                {isBlockedForCity ? (
                  <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                    <div className="font-semibold mb-1">Abonnement actif existant</div>
                    Vous avez déjà un abonnement actif pour {selectedCity.name}. Un nouvel abonnement désactivera automatiquement l'ancien.
                  </div>
                ) : (
                  <button
                    className="w-full bg-accent text-accent-foreground py-3 rounded-lg hover:bg-accent/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handlePurchase('YEARLY')}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? 'Traitement...' : 'Acheter (annuel)'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center py-12">
          <div className="text-muted-foreground text-center">
            <p className="text-lg mb-2">Sélectionnez une ville pour voir les offres disponibles</p>
          </div>
        </div>
      )}
    </div>
  )
}
