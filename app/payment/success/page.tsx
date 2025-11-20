"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { purchaseSubscription } from "@/lib/api/subscriptions"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null)

  const type = searchParams.get("type")
  const referenceId = searchParams.get("referenceId")
  const cityId = searchParams.get("cityId")
  const subscriptionType = searchParams.get("subscriptionType")
  const trajetId = searchParams.get("trajetId")
  const seatNumber = searchParams.get("seatNumber")
  const userId = searchParams.get("userId")

  useEffect(() => {
    // If it's a subscription payment, create the subscription now
    if (type === "ABONNEMENT" && cityId && subscriptionType && userId && !processing && !subscriptionId) {
      const createSubscription = async () => {
        setProcessing(true)
        try {
          const res = await purchaseSubscription({
            userId: Number(userId),
            cityId: Number(cityId),
            type: subscriptionType as 'MONTHLY' | 'YEARLY'
          })
          
          if (res.success && res.subscription) {
            setSubscriptionId(res.subscription.id)
          } else {
            setError(res.message || "Erreur lors de la création de l'abonnement")
          }
        } catch (err) {
          console.error("Error creating subscription:", err)
          setError("Une erreur est survenue lors de la création de l'abonnement")
        } finally {
          setProcessing(false)
        }
      }
      
      createSubscription()
    }
    
    // If it's a ticket payment, create the ticket now
    if (type === "TICKET" && trajetId && cityId && userId && !processing && !subscriptionId) {
      const createTicket = async () => {
        setProcessing(true)
        try {
          const { purchaseTicket } = await import('@/lib/api/tickets')
          const res = await purchaseTicket({
            trajetId: Number(trajetId),
            userId: Number(userId),
            seatNumber: seatNumber || "AUTO",
            selectedStartTime: "",
            cityId: Number(cityId),
          })
          
          if (res.success && res.ticketId) {
            setSubscriptionId(res.ticketId)
          } else {
            setError(res.message || "Erreur lors de la création du billet")
          }
        } catch (err) {
          console.error("Error creating ticket:", err)
          setError("Une erreur est survenue lors de la création du billet")
        } finally {
          setProcessing(false)
        }
      }
      
      createTicket()
    }
  }, [type, cityId, subscriptionType, trajetId, seatNumber, userId, processing, subscriptionId])

  const displayReferenceId = type === "ABONNEMENT" ? (subscriptionId || referenceId) : referenceId

  if (processing) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl rounded-3xl bg-white shadow-xl border border-border/40 p-10 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-4">
            Finalisation de votre {type === "TICKET" ? "billet" : "abonnement"}...
          </h1>
          <p className="text-muted-foreground">
            Veuillez patienter pendant que nous activons votre {type === "TICKET" ? "billet" : "abonnement"}.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl rounded-3xl bg-white shadow-xl border border-border/40 p-10 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-4xl font-semibold text-foreground mb-4">Erreur</h1>
          <p className="text-muted-foreground mb-8">{error}</p>
          <button
            onClick={() => router.push(type === "TICKET" ? "/dashboard/booking" : "/dashboard/subscriptions")}
            className="w-full rounded-xl bg-primary px-6 py-3 text-lg font-semibold text-white transition hover:bg-primary/90"
          >
            Retour {type === "TICKET" ? "à la réservation" : "aux abonnements"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-xl border border-border/40 p-10 text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-10 w-10 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-4xl font-semibold text-foreground mb-4">Paiement réussi !</h1>
        <p className="text-muted-foreground mb-8">
          Votre paiement a été confirmé avec succès.{" "}
          {type === "TICKET" ? "Le ticket" : type === "ABONNEMENT" ? "L'abonnement" : "Votre achat"} #{displayReferenceId} est maintenant actif.
        </p>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-emerald-500"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  )
}


