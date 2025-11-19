"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, MapPin, Save } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [email, setEmail] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const userEmail = localStorage.getItem("userEmail")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!token) {
      router.push("/login")
      return
    }
    if (isAdmin) {
      router.push("/dashboard/admin")
      return
    }
    setEmail(userEmail || "")
  }, [router])

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-header">My Profile</h1>
        <p className="section-description">Manage your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Header */}
        <div className="lg:col-span-1">
          <div className="card-premium rounded-xl p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground">User Profile</h3>
            <p className="text-sm text-muted-foreground mt-1">{email}</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="card-premium rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Personal Information</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                {isEditing ? "Save" : "Edit"}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <input
                  type="text"
                  defaultValue="John Doe"
                  disabled={!isEditing}
                  className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-card text-foreground disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={email}
                  disabled={!isEditing}
                  className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-card text-foreground disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                <input
                  type="tel"
                  defaultValue="+1 (555) 123-4567"
                  disabled={!isEditing}
                  className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-card text-foreground disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                <input
                  type="text"
                  defaultValue="123 Main Street, City, ST 12345"
                  disabled={!isEditing}
                  className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-card text-foreground disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card-premium rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-foreground">Email notifications</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-foreground">SMS alerts</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-foreground">Marketing emails</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
