"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import { registerUser, loginUser, checkIsAdmin } from "@/lib/api/auth"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required")
      setLoading(false)
      return
    }

    if (!formData.email.includes("@")) {
      setError("Invalid email format")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      // 1) Register user in backend
      const registered = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      // 2) Immediately log them in to get token
      const login = await loginUser({
        email: formData.email,
        password: formData.password,
      })

      // 3) Determine admin status from normalized user data
      // The loginUser function already normalizes role to isAdmin
      let isAdminFlag = login.user.isAdmin === true
      
      // If isAdmin is not set, try to check via API
      if (typeof login.user.isAdmin !== "boolean") {
        try {
          isAdminFlag = await checkIsAdmin(login.user.id)
        } catch {
          // ignore admin check failure
        }
      }

      // 4) Persist auth in localStorage
      localStorage.setItem("authToken", login.token)
      localStorage.setItem("userId", String(login.user.id))
      localStorage.setItem("userEmail", login.user.email)
      // Use nom if available, otherwise name
      localStorage.setItem("userName", login.user.nom || login.user.name || "")
      if (isAdminFlag) {
        localStorage.setItem("isAdmin", "true")
      } else {
        localStorage.removeItem("isAdmin")
      }

      setLoading(false)

      // 5) Redirect based on role
      if (isAdminFlag) {
        router.push("/dashboard/admin")
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed"
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center py-20 px-4">
        <Card className="w-full max-w-md">
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-2">Join UrbanGo</h1>
            <p className="text-muted-foreground mb-6">Create your account and start booking</p>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6"
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
