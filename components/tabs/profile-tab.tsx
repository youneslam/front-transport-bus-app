"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogOut } from "lucide-react"

interface UserProfile {
  name: string
  email: string
  phone: string
  city: string
  country: string
  joinDate: string
  totalTrips: number
  totalSpent: number
  memberStatus: string
}

export default function ProfileTab() {
  const [formData, setFormData] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    joinDate: "",
    totalTrips: 0,
    totalSpent: 0,
    memberStatus: "Silver",
  })
  const [saved, setSaved] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [activeProfileTab, setActiveProfileTab] = useState<"personal" | "preferences" | "security">("personal")

  useEffect(() => {
    const name = localStorage.getItem("userName") || "John Doe"
    const email = localStorage.getItem("userEmail") || "john@example.com"
    const joinDateStored = localStorage.getItem("userJoinDate")

    const joinDate = joinDateStored || new Date().toISOString().split("T")[0]
    if (!joinDateStored) {
      localStorage.setItem("userJoinDate", joinDate)
    }

    setFormData({
      name,
      email,
      phone: localStorage.getItem("userPhone") || "+1 (555) 123-4567",
      city: localStorage.getItem("userCity") || "New York",
      country: localStorage.getItem("userCountry") || "United States",
      joinDate,
      totalTrips: Number.parseInt(localStorage.getItem("userTotalTrips") || "24", 10),
      totalSpent: Number.parseFloat(localStorage.getItem("userTotalSpent") || "450.50"),
      memberStatus: localStorage.getItem("userMemberStatus") || "Silver",
    })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSave = () => {
    localStorage.setItem("userName", formData.name)
    localStorage.setItem("userPhone", formData.phone)
    localStorage.setItem("userCity", formData.city)
    localStorage.setItem("userCountry", formData.country)
    setSaved(true)
    setEditMode(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userName")
    window.location.href = "/"
  }

  const getMemberBadgeColor = (status: string): string => {
    switch (status) {
      case "Gold":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "Silver":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "Bronze":
        return "bg-orange-100 text-orange-800 border-orange-300"
      default:
        return "bg-blue-100 text-blue-800 border-blue-300"
    }
  }

  return (
    <div className="space-y-6">
      {/* User Header Card */}
      <Card className="p-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{formData.name}</h1>
            <p className="text-muted-foreground flex items-center gap-4">
              <span>{formData.email}</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getMemberBadgeColor(formData.memberStatus)}`}
              >
                {formData.memberStatus} Member
              </span>
            </p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground mt-4 md:mt-0 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Member Since</p>
            <p className="font-bold">{new Date(formData.joinDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Trips</p>
            <p className="font-bold text-lg text-accent">{formData.totalTrips}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Amount Spent</p>
            <p className="font-bold">${formData.totalSpent.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Rewards Points</p>
            <p className="font-bold text-lg">{formData.totalTrips * 10}</p>
          </div>
        </div>
      </Card>

      {/* Profile Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveProfileTab("personal")}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeProfileTab === "personal"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Personal Info
        </button>
        <button
          onClick={() => setActiveProfileTab("preferences")}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeProfileTab === "preferences"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Preferences
        </button>
        <button
          onClick={() => setActiveProfileTab("security")}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeProfileTab === "security"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Security
        </button>
      </div>

      {/* Personal Info Tab */}
      {activeProfileTab === "personal" && (
        <Card className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Personal Information</h2>
            <Button
              onClick={() => setEditMode(!editMode)}
              className={editMode ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90"}
              variant={editMode ? "default" : "outline"}
            >
              {editMode ? "Done Editing" : "Edit Profile"}
            </Button>
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-900 px-4 py-3 rounded-lg">
              Profile updated successfully!
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                disabled={!editMode}
                className={!editMode ? "bg-muted" : ""}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                placeholder="Email"
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                disabled={!editMode}
                className={!editMode ? "bg-muted" : ""}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  disabled={!editMode}
                  className={!editMode ? "bg-muted" : ""}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <Input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  disabled={!editMode}
                  className={!editMode ? "bg-muted" : ""}
                />
              </div>
            </div>

            {editMode && (
              <Button
                onClick={handleSave}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-6 mt-6"
              >
                Save Changes
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Preferences Tab */}
      {activeProfileTab === "preferences" && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Email Notifications</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm">Trip reminders (30 mins before departure)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm">Promotional offers and deals</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm">Service updates and maintenance alerts</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm">Account security alerts</span>
              </label>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Language & Regional</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Language</label>
                <Input defaultValue="English" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <Input defaultValue="Eastern Standard Time (EST)" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Display Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm">Dark mode</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm">Compact view</span>
              </label>
            </div>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeProfileTab === "security" && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Password & Security</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full bg-transparent">
                Change Password
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Enable Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                View Active Sessions
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Privacy & Data</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full bg-transparent">
                Download My Data
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Privacy Settings
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-destructive/20 bg-destructive/5">
            <h3 className="text-lg font-bold mb-4 text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">These actions cannot be undone. Please be careful.</p>
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
            >
              Delete Account
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Login History</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-semibold">Chrome on Windows</p>
                  <p className="text-xs text-muted-foreground">192.168.1.1 • Today at 2:45 PM</p>
                </div>
                <span className="text-xs font-semibold text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-semibold">Safari on iPhone</p>
                  <p className="text-xs text-muted-foreground">192.168.1.5 • Yesterday at 10:20 AM</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Nov 9, 2024</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
