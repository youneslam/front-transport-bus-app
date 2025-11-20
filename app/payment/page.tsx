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
  const providedClientSecret = searchParams.get("clientSecret")

  const normalizedType = useMemo(() => {
    if (!typeParam) return null
    return typeParam === "ABONNEMENT" ? "SUBSCRIPTION" : typeParam
  }, [typeParam])

  const [clientSecret, setClientSecret] = useState<string | null>(providedClientSecret)
  const [loading, setLoading] = useState(!providedClientSecret)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (clientSecret || providedClientSecret) {
      setLoading(false)
      return
    }

    const hasAllParams =
      normalizedType &&
      referenceIdParam &&
      amountParam &&
      userIdParam &&
      !Number.isNaN(Number(referenceIdParam)) &&
      !Number.isNaN(Number(amountParam)) &&
      !Number.isNaN(Number(userIdParam))

    if (!hasAllParams) {
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

        const payment = await createPaymentIntent({
          type: normalizedType as "TICKET" | "SUBSCRIPTION",
          referenceId: Number(referenceIdParam),
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
  }, [normalizedType, referenceIdParam, amountParam, userIdParam, clientSecret, providedClientSecret])

  const formattedAmount = amountParam ? Number(amountParam).toFixed(2) : "0.00"

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
              {normalizedType === "SUBSCRIPTION" ? "Abonnement" : "Billet"} #{referenceIdParam}
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
                Transaction liée au {normalizedType === "SUBSCRIPTION" ? "abonnement" : "ticket"} #{referenceIdParam}
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
                  type={normalizedType as "TICKET" | "SUBSCRIPTION"}
                  referenceId={Number(referenceIdParam)}
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


