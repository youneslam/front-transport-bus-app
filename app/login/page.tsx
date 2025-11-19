"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import { loginUser, checkIsAdmin } from "@/lib/api/auth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!email.includes("@") || password.length < 3) {
      setError("Invalid email or password")
      setLoading(false)
      return
    }

    try {
      const result = await loginUser({ email, password })

      // Determine admin status from normalized user data
      // The loginUser function already normalizes role to isAdmin
      let isAdminFlag = result.user.isAdmin === true
      
      // If isAdmin is not set, try to check via API
      if (typeof result.user.isAdmin !== "boolean") {
        try {
          isAdminFlag = await checkIsAdmin(result.user.id)
        } catch {
          // ignore admin check failure, keep false
        }
      }

      // Persist auth in localStorage for the rest of the app
      localStorage.setItem("authToken", result.token)
      localStorage.setItem("userId", String(result.user.id))
      localStorage.setItem("userEmail", result.user.email)
      // Use nom if available, otherwise name
      localStorage.setItem("userName", result.user.nom || result.user.name || "")
      if (isAdminFlag) {
        localStorage.setItem("isAdmin", "true")
      } else {
        localStorage.removeItem("isAdmin")
      }

      setLoading(false)

      // Redirect based on role
      if (isAdminFlag) {
        router.push("/dashboard/admin")
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed"
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      </div>
      <div className="flex items-center justify-center py-20 px-4">
        <Card className="w-full max-w-md card-premium rounded-2xl border-border/40">
          <div className="p-8 space-y-6">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Welcome Back</h1>
              <p className="text-muted-foreground mt-2">Sign in to your UrbanGo account</p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive/90 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-input border-border/50 focus:border-primary/60 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-input border-border/50 focus:border-primary/60 focus:ring-primary/20"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground py-6 border-0 glow-primary font-semibold"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="pt-2 text-center text-xs text-muted-foreground space-y-2">
              <div>
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  Sign up
                </Link>
              </div>
              <div className="border-t border-border/40 pt-2 text-muted-foreground/70">
                Demo Admin: <strong>admin@urbango.com</strong> / <strong>admin</strong>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
