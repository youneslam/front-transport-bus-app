"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Radio } from "lucide-react"
import { AdminBusManager } from "@/components/bus/admin-bus-manager"
import { SimulateBus } from "@/components/bus/simulate-bus"

export default function AdminBusesPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!token || !isAdmin) {
      router.push("/login")
    }
  }, [router])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="section-header flex items-center gap-2">
          <Radio className="w-6 h-6 text-primary" />
          Gestion des bus connectés
        </h1>
        <p className="section-description">
          Administrez les bus via l&apos;API REST et testez les flux GPS envoyés sur le WebSocket.
        </p>
      </div>

      <AdminBusManager />

      <SimulateBus />
    </div>
  )
}
