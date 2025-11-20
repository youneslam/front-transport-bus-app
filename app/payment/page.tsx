"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

import PaymentForm from "@/components/PaymentForm"
import { createPaymentIntent } from "@/lib/api/payments"

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const typeParam = searchParams.get("type")
  const referenceIdParam = searchParams.get("referenceId")
  const amountParam = searchParams.get("amount")
  const userIdParam = searchParams.get("userId")
  
  // New subscription flow params
  const cityIdParam = searchParams.get("cityId")
  const subscriptionTypeParam = searchParams.get("subscriptionType")
  
  // New ticket flow params
  const trajetIdParam = searchParams.get("trajetId")
  const trajetNameParam = searchParams.get("trajetName")
  const seatNumberParam = searchParams.get("seatNumber")

  const normalizedType = useMemo(() => {
    if (!typeParam) return null
    // Keep ABONNEMENT as-is for backend, only normalize for display
    return typeParam
  }, [typeParam])

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (clientSecret) {
      setLoading(false)
      return
    }

    // Different params required based on payment type
    const isSubscription = normalizedType === "ABONNEMENT"
    const isTicket = normalizedType === "TICKET"
    
    const hasRequiredParams = isSubscription
      ? normalizedType &&
        cityIdParam &&
        subscriptionTypeParam &&
        amountParam &&
        userIdParam &&
        !Number.isNaN(Number(cityIdParam)) &&
        !Number.isNaN(Number(amountParam)) &&
        !Number.isNaN(Number(userIdParam))
      : isTicket && trajetIdParam
      ? normalizedType &&
        trajetIdParam &&
        cityIdParam &&
        amountParam &&
        userIdParam &&
        !Number.isNaN(Number(trajetIdParam)) &&
        !Number.isNaN(Number(cityIdParam)) &&
        !Number.isNaN(Number(amountParam)) &&
        !Number.isNaN(Number(userIdParam))
      : normalizedType &&
        referenceIdParam &&
        amountParam &&
        userIdParam &&
        !Number.isNaN(Number(referenceIdParam)) &&
        !Number.isNaN(Number(amountParam)) &&
        !Number.isNaN(Number(userIdParam))

    if (!hasRequiredParams) {
      setLoading(false)
      setError("Paramètres de paiement invalides.")
      return
    }

    if (!publishableKey || !stripePromise) {
      setLoading(false)
      setError("Stripe n'est pas configuré. Définissez NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.")
      return
    }

    const initializePayment = async () => {
      try {
        setLoading(true)
        setError(null)

        // For subscriptions and tickets without referenceId yet, use 0 as placeholder
        const isSubscription = normalizedType === "ABONNEMENT"
        const isTicket = normalizedType === "TICKET" && trajetIdParam
        const refId = (isSubscription || isTicket) && !referenceIdParam ? 0 : Number(referenceIdParam)

        const payment = await createPaymentIntent({
          type: normalizedType as "TICKET" | "ABONNEMENT",
          referenceId: refId,
          amount: Number(amountParam),
          userId: Number(userIdParam),
          currency: "USD",
        })

        if (!payment.clientSecret) {
          throw new Error("Le backend n'a pas renvoyé de clientSecret. Vérifiez votre intégration Stripe.")
        }

        setClientSecret(payment.clientSecret)
      } catch (err) {
        console.error("Erreur lors de l'initialisation du paiement:", err)
        setError(
          err instanceof Error ? err.message : "Impossible d'initialiser le paiement pour le moment.",
        )
      } finally {
        setLoading(false)
      }
    }

    void initializePayment()
  }, [normalizedType, referenceIdParam, amountParam, userIdParam, cityIdParam, subscriptionTypeParam, trajetIdParam, seatNumberParam, clientSecret])

  const formattedAmount = amountParam ? Number(amountParam).toFixed(2) : "0.00"
  
  // Display reference ID or type description for items without ID yet
  const displayReference = referenceIdParam || (subscriptionTypeParam ? `${subscriptionTypeParam}` : trajetNameParam ? `${trajetNameParam}` : "Nouveau")

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-card shadow-2xl border border-border/60">
          <div className="border-b border-border px-8 py-6">
            <button
              onClick={() => router.back()}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Retour
            </button>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mt-2">
              Paiement sécurisé
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">
              {normalizedType === "ABONNEMENT" 
                ? `Abonnement ${subscriptionTypeParam === 'MONTHLY' ? '(par mois)' : subscriptionTypeParam === 'YEARLY' ? '(par an)' : ''}` 
                : trajetNameParam 
                  ? `Billet de Trajet ${displayReference}` 
                  : `Billet ${displayReference ? `#${displayReference}` : ""}`}
            </h1>
          </div>

          <div className="px-8 py-6">
            <div className="mb-6 rounded-2xl border border-border bg-muted/30 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Montant à régler</span>
                <span className="text-3xl font-bold text-foreground">
                  {formattedAmount}{" "}
                  <span className="text-base font-medium text-muted-foreground">MAD</span>
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {normalizedType === "ABONNEMENT" 
                  ? `Transaction liée à l'abonnement ${subscriptionTypeParam === 'MONTHLY' ? '(par mois)' : subscriptionTypeParam === 'YEARLY' ? '(par an)' : ''}`
                  : trajetNameParam
                    ? `Ticket de Trajet ${displayReference}`
                    : `Transaction liée au ticket ${displayReference ? `#${displayReference}` : ""}`}
              </p>
            </div>

            {loading && (
              <div className="rounded-2xl border border-border bg-muted/10 p-6 text-center text-muted-foreground">
                Initialisation du paiement...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                {error}
                <p className="mt-2 text-sm text-red-600">
                  Veuillez vérifier votre configuration Stripe ou réessayer plus tard.
                </p>
              </div>
            )}

            {!loading && !error && clientSecret && stripePromise && (
              <Elements stripe={stripePromise} options={{ clientSecret }} key={clientSecret}>
                <PaymentForm
                  type={normalizedType as "TICKET" | "ABONNEMENT"}
                  referenceId={referenceIdParam ? Number(referenceIdParam) : undefined}
                  cityId={cityIdParam ? Number(cityIdParam) : undefined}
                  subscriptionType={subscriptionTypeParam as "MONTHLY" | "YEARLY" | undefined}
                  trajetId={trajetIdParam ? Number(trajetIdParam) : undefined}
                  trajetName={trajetNameParam || undefined}
                  seatNumber={seatNumberParam || undefined}
                  amount={Number(amountParam)}
                  userId={Number(userIdParam)}
                />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


