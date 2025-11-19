"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function Navbar() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    setIsLoggedIn(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userEmail")
    router.push("/")
  }

  return (
    <nav className="border-b border-border/40 bg-card/30 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center glow-primary">
              <span className="text-primary-foreground font-bold text-lg">U</span>
            </div>
            <span className="font-bold text-lg gradient-text">UrbanGo</span>
          </Link>
          <div className="flex gap-3">
            {isLoggedIn ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                  className="hover:bg-primary/10 text-foreground hover:text-primary transition-colors"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 text-destructive-foreground border-0 glow-primary"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/login")}
                  className="hover:bg-primary/10 text-foreground hover:text-primary transition-colors"
                >
                  Login
                </Button>
                <Button
                  onClick={() => router.push("/signup")}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground border-0 glow-primary"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
