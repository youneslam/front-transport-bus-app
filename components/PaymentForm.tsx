'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'

interface PaymentFormProps {
  type: 'TICKET' | 'ABONNEMENT'
  referenceId?: number
  cityId?: number
  subscriptionType?: 'MONTHLY' | 'YEARLY'
  trajetId?: number
  trajetName?: string
  seatNumber?: string
  amount: number
  userId: number
}

export default function PaymentForm({
  type,
  referenceId,
  cityId,
  subscriptionType,
  trajetId,
  trajetName,
  seatNumber,
  amount,
  userId,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isElementReady, setIsElementReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const confirmationUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/payment/success'
    const url = new URL('/payment/success', window.location.origin)
    url.searchParams.set('type', type)
    
    // For subscriptions with new flow, pass cityId and subscriptionType
    if (type === 'ABONNEMENT' && cityId && subscriptionType) {
      url.searchParams.set('cityId', String(cityId))
      url.searchParams.set('subscriptionType', subscriptionType)
    } else if (type === 'TICKET' && trajetId && cityId) {
      // For tickets with new flow, pass trajetId, cityId, trajetName, and seatNumber
      url.searchParams.set('trajetId', String(trajetId))
      url.searchParams.set('cityId', String(cityId))
      if (trajetName) url.searchParams.set('trajetName', trajetName)
      if (seatNumber) url.searchParams.set('seatNumber', seatNumber)
    } else if (referenceId) {
      // For old flows, use referenceId
      url.searchParams.set('referenceId', String(referenceId))
    }
    
    url.searchParams.set('amount', String(amount))
    url.searchParams.set('userId', String(userId))
    return url.toString()
  }, [type, referenceId, cityId, subscriptionType, trajetId, trajetName, seatNumber, amount, userId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setError('Service de paiement indisponible. Réessayez plus tard.')
      return
    }

    const paymentElement = elements.getElement(PaymentElement)
    if (!paymentElement) {
      setError('Le formulaire de paiement se charge, veuillez patienter.')
      return
    }

    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: confirmationUrl,
        },
      })

      if (submitError) {
        setError(submitError.message || 'Le paiement a échoué.')
      }
    } catch (err) {
      console.error('Erreur lors de la confirmation du paiement:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur inattendue est survenue.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-border bg-background p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
          onReady={() => setIsElementReady(true)}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || !isElementReady || isSubmitting}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {isSubmitting ? 'Traitement en cours...' : 'Payer maintenant'}
      </button>
    </form>
  )
}


