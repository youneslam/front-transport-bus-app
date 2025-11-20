"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from 'next/navigation'
import { Building2, Edit2, Trash2, Plus, DollarSign, Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  createSubscriptionCity,
  listSubscriptionCities,
  updateSubscriptionCity,
  deleteSubscriptionCity,
  SubscriptionCity,
  CreateSubscriptionCityRequest,
} from '@/lib/api/subscriptions'

export default function AdminSubscriptionCitiesPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [cities, setCities] = useState<SubscriptionCity[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  // modal state
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SubscriptionCity | null>(null)
  const [name, setName] = useState('')
  const [monthlyPriceNormal, setMonthlyPriceNormal] = useState<number>(0)
  const [yearlyPriceNormal, setYearlyPriceNormal] = useState<number>(0)

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!token || !isAdmin) {
      router.push("/login")
    } else {
      load()
    }
  }, [router])

  const load = async () => {
    setLoading(true)
    try {
      const data = await listSubscriptionCities()
      setCities(data)
    } catch (err) {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de charger les villes d\'abonnement.',
        variant: "destructive" as const
      })
    } finally {
      setLoading(false)
    }
  }

  const onOpenCreate = () => {
    setEditing(null)
    setName('')
    setMonthlyPriceNormal(0)
    setYearlyPriceNormal(0)
    setOpen(true)
  }

  const onOpenEdit = (city: SubscriptionCity) => {
    setEditing(city)
    setName(city.name)
    setMonthlyPriceNormal(city.monthlyPriceNormal)
    setYearlyPriceNormal(city.yearlyPriceNormal)
    setOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        toast({ title: 'Validation', description: 'Le nom de la ville est requis.' })
        return
      }
      if (monthlyPriceNormal <= 0 || isNaN(monthlyPriceNormal)) {
        toast({ title: 'Validation', description: 'Le prix mensuel doit être supérieur à 0.' })
        return
      }
      if (yearlyPriceNormal <= 0 || isNaN(yearlyPriceNormal)) {
        toast({ title: 'Validation', description: 'Le prix annuel doit être supérieur à 0.' })
        return
      }

      if (editing) {
        await updateSubscriptionCity(editing.id, { 
          name: name.trim(), 
          monthlyPriceNormal: Number(monthlyPriceNormal), 
          yearlyPriceNormal: Number(yearlyPriceNormal)
        })
        toast({ title: 'Mis à jour', description: 'Ville d\'abonnement mise à jour.' })
      } else {
        // Calculer automatiquement le prochain ID en incrémentant le maximum existant
        const maxId = cities.length > 0 
          ? Math.max(...cities.map(c => c.id))
          : 0
        const nextId = maxId + 1
        
        const payload: CreateSubscriptionCityRequest = {
          id: nextId,
          name: name.trim(),
          monthlyPriceNormal: Number(monthlyPriceNormal),
          yearlyPriceNormal: Number(yearlyPriceNormal)
        }
        
        console.log('Création de ville d\'abonnement avec payload:', payload)
        const created = await createSubscriptionCity(payload)
        console.log('Ville créée avec succès:', created)
        toast({ title: 'Créé', description: 'Ville d\'abonnement créée avec succès.' })
      }
      setOpen(false)
      // Réinitialiser le formulaire
      setName('')
      setMonthlyPriceNormal(0)
      setYearlyPriceNormal(0)
      setEditing(null)
      load()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Opération échouée.'
      console.error("Erreur complète lors de la sauvegarde:", err)
      toast({ 
        title: 'Erreur', 
        description: errorMessage,
        variant: "destructive" as const
      })
    }
  }

  const handleDelete = async (city: SubscriptionCity) => {
    const ok = window.confirm(`Supprimer la ville d'abonnement "${city.name}" ?`)
    if (!ok) return
    try {
      await deleteSubscriptionCity(city.id)
      toast({ title: 'Supprimé', description: 'Ville d\'abonnement supprimée.' })
      load()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de supprimer.'
      toast({ 
        title: 'Erreur', 
        description: errorMessage,
        variant: "destructive" as const
      })
      console.error("Erreur complète:", err)
    }
  }

  const filteredCities = useMemo(
    () =>
      cities.filter((city) =>
        city.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [cities, search],
  )

  return (
    <div className="space-y-6">
      {/* HEADER + ACTIONS */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="section-header flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            Gestion des Villes d&apos;Abonnement
          </h1>
          <p className="section-description">
            Gérer les villes et leurs tarifs d&apos;abonnement mensuel et annuel
          </p>
          {cities.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {filteredCities.length} ville(s) affichée(s) sur {cities.length}
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <Input
            placeholder="Rechercher une ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={onOpenCreate} className="gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Nouvelle ville
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Chargement...</div>
          ) : cities.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">Aucune ville d'abonnement pour le moment.</p>
              <Button onClick={onOpenCreate} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Créer la première ville
              </Button>
            </div>
          ) : filteredCities.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">
                Aucune ville ne correspond à votre recherche.
              </p>
              <p className="text-xs text-muted-foreground">
                Essayez un autre nom ou videz le filtre de recherche.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-4 px-6 font-semibold text-sm">Nom de la ville</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Prix mensuel</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Prix annuel</th>
                    <th className="text-center py-4 px-6 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCities.map((city) => (
                    <tr key={city.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{city.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="secondary" className="gap-1">
                          <Calendar className="w-3 h-3" />
                          {city.monthlyPriceNormal.toFixed(2)} DH/mois
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="default" className="gap-1">
                          <DollarSign className="w-3 h-3" />
                          {city.yearlyPriceNormal.toFixed(2)} DH/an
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => onOpenEdit(city)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(city)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {editing ? 'Modifier la ville d\'abonnement' : 'Créer une nouvelle ville d\'abonnement'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la ville *</Label>
              <Input
                id="name"
                placeholder="Ex: Casablanca, Rabat, Marrakech..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const monthlyInput = document.getElementById('monthlyPriceNormal') as HTMLInputElement
                    monthlyInput?.focus()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Le nom de la ville sera utilisé pour les abonnements
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyPriceNormal">Prix mensuel (DH) *</Label>
                <Input
                  id="monthlyPriceNormal"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="150.00"
                  value={monthlyPriceNormal > 0 ? monthlyPriceNormal : ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                    setMonthlyPriceNormal(isNaN(value) ? 0 : value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const yearlyInput = document.getElementById('yearlyPriceNormal') as HTMLInputElement
                      yearlyInput?.focus()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Prix en dirhams pour un abonnement mensuel
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearlyPriceNormal">Prix annuel (DH) *</Label>
                <Input
                  id="yearlyPriceNormal"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1500.00"
                  value={yearlyPriceNormal > 0 ? yearlyPriceNormal : ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                    setYearlyPriceNormal(isNaN(value) ? 0 : value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSave()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Prix en dirhams pour un abonnement annuel
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="gap-2">
              {editing ? (
                <>
                  <Edit2 className="w-4 h-4" />
                  Mettre à jour
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Créer la ville
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

