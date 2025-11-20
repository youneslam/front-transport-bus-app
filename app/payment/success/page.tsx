"use client"

import { useSearchParams, useRouter } from "next/navigation"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const type = searchParams.get("type")
  const referenceId = searchParams.get("referenceId")

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
          {type === "TICKET" ? "Le ticket" : "L'abonnement"} #{referenceId} est maintenant actif.
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


