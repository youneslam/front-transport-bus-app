"use client"

import Sidebar from "@/components/sidebar"
import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const authToken = localStorage.getItem("authToken")
    const userEmail = localStorage.getItem("userEmail")
    const name = localStorage.getItem("userName") || "User"
    const adminStatus = localStorage.getItem("isAdmin") === "true"

    if (!authToken || !userEmail) {
      router.push("/login")
      return
    }

    setIsAuthenticated(true)
    setIsAdmin(adminStatus)
    setUserName(name)
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} userName={userName} />
      <main className="flex-1 md:ml-64 transition-all duration-300">
        <div className="min-h-screen p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
