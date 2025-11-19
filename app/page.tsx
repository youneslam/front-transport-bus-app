"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import HeroSection from "@/components/hero-section"
import FeaturesSection from "@/components/features-section"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (token) {
      if (isAdmin) {
        router.push("/dashboard/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection onGetStarted={() => router.push("/login")} />
      <FeaturesSection />
    </div>
  )
}
