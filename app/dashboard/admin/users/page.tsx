"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { Users, Mail, Shield, ShieldCheck, RefreshCw, UserPlus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { listUsers, promoteUserToAdmin, BackendUser } from "@/lib/api/auth"

export default function AdminUsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<BackendUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!token || !isAdmin) {
      router.push("/login")
      return
    }
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const loadUsers = async (forceRefresh: boolean = false) => {
    setLoading(true)
    try {
      const data = await listUsers(forceRefresh)
      setUsers(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Impossible de charger les utilisateurs."
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper to get user name (supports both 'nom' and 'name')
  const getUserName = (user: BackendUser): string => {
    return user.nom || user.name || "Utilisateur inconnu"
  }

  const handlePromoteToAdmin = async (targetId: number, targetName: string) => {
    const callerIdStr = localStorage.getItem("userId")
    if (!callerIdStr) {
      toast({
        title: "Erreur",
        description: "ID utilisateur introuvable.",
        variant: "destructive",
      })
      return
    }

    const callerId = Number(callerIdStr)
    if (isNaN(callerId)) {
      toast({
        title: "Erreur",
        description: "ID utilisateur invalide.",
        variant: "destructive",
      })
      return
    }

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir promouvoir ${targetName} en administrateur ?`
    )
    if (!confirmed) return

    try {
      await promoteUserToAdmin(callerId, targetId)
      
      // Mise à jour optimiste de l'état local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === targetId ? { ...user, isAdmin: true, role: "ADMIN" } : user
        )
      )
      
      toast({
        title: "Succès",
        description: `${targetName} a été promu administrateur.`,
      })
      
      // Attendre un peu pour laisser le backend se mettre à jour
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Recharger la liste des utilisateurs avec force refresh
      await loadUsers(true)
    } catch (error) {
      // En cas d'erreur, recharger quand même pour avoir l'état réel
      await loadUsers(true)
      const errorMessage = error instanceof Error ? error.message : "Impossible de promouvoir l'utilisateur."
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const adminCount = users.filter(u => u.isAdmin).length
  const passengerCount = users.filter(u => !u.isAdmin).length

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            Gestion des Utilisateurs
          </h1>
          <p className="section-description">Gérer les utilisateurs du système et leurs rôles</p>
        </div>
        <Button onClick={() => loadUsers(true)} variant="outline" className="gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Utilisateurs</p>
                <p className="text-3xl font-bold text-primary mt-2">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Administrateurs</p>
                <p className="text-3xl font-bold text-accent mt-2">{adminCount}</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-accent/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Passagers</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{passengerCount}</p>
              </div>
              <UserPlus className="w-8 h-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Chargement...</div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">Aucun utilisateur disponible.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-4 px-6 font-semibold text-sm">Nom</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Email</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Rôle</th>
                    <th className="text-center py-4 px-6 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const userName = getUserName(user)
                    return (
                      <tr key={user.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{userName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {user.isAdmin ? (
                            <Badge variant="default" className="gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Administrateur
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Shield className="w-3 h-3" />
                              Passager
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {!user.isAdmin && (
                              <Button
                                onClick={() => handlePromoteToAdmin(user.id, userName)}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                Promouvoir Admin
                              </Button>
                            )}
                            {user.isAdmin && (
                              <span className="text-sm text-muted-foreground">Déjà admin</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
