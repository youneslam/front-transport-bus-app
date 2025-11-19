"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { Building2, Edit2, Trash2, Plus, DollarSign } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { listTickets, updateTicket } from '@/lib/api/tickets'
import { listTrajets } from '@/lib/api/trajets'
import { createCity, listCities, updateCity, deleteCity, City } from '@/lib/api/cities'

export default function AdminCitiesPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)

  // modal state
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<City | null>(null)
  const [cityName, setCityName] = useState('')
  const [priceInDhs, setPriceInDhs] = useState<number>(0)

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
      const data = await listCities()
      setCities(data)
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de charger les villes.' })
    } finally {
      setLoading(false)
    }
  }

  const onOpenCreate = () => {
    setEditing(null)
    setCityName('')
    setPriceInDhs(0)
    setOpen(true)
  }

  const onOpenEdit = (city: City) => {
    setEditing(city)
    setCityName(city.cityName)
    setPriceInDhs(city.priceInDhs)
    setOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!cityName.trim()) {
        toast({ title: 'Validation', description: 'Le nom de la ville est requis.' })
        return
      }
      if (priceInDhs <= 0) {
        toast({ title: 'Validation', description: 'Le prix doit être supérieur à 0.' })
        return
      }

      if (editing) {
        const cityId = editing.id
        await updateCity(cityId, { cityName, priceInDhs })
        toast({ title: 'Mis à jour', description: 'Ville mise à jour.' })
        
        // Update associated tickets via trajets
        try {
          // Get all trajets for this city
          const allTrajets = await listTrajets()
          const trajetsForCity = allTrajets.filter(trajet => trajet.cityId === cityId)
          
          if (trajetsForCity.length > 0) {
            // Get all tickets
            const allTickets = await listTickets()
            // Find tickets that belong to trajets of this city
            const trajetIds = trajetsForCity.map(t => t.id)
            const ticketsToUpdate = allTickets.filter(ticket => 
              trajetIds.includes(ticket.trajetId)
            )
            
            if (ticketsToUpdate.length > 0) {
              // Update each ticket with new description
              const updatePromises = ticketsToUpdate.map(ticket =>
                updateTicket(ticket.id, {
                  description: `Ticket mis à jour - Prix: ${priceInDhs.toFixed(2)} DH (${cityName})`
                })
              )
              
              await Promise.all(updatePromises)
              toast({ 
                title: 'Tickets mis à jour', 
                description: `${ticketsToUpdate.length} ticket(s) associé(s) mis à jour.` 
              })
            } else {
              console.log(`Aucun ticket trouvé pour les trajets de la ville ${cityName}`)
            }
          } else {
            console.log(`Aucun trajet trouvé pour la ville ${cityName}`)
          }
        } catch (ticketError) {
          // Log error but don't fail the whole operation
          console.error("Erreur lors de la mise à jour des tickets:", ticketError)
          toast({ 
            title: "Avertissement", 
            description: "Ville mise à jour mais échec de la mise à jour des tickets associés.",
            variant: "destructive" as const
          })
        }
      } else {
        await createCity({ cityName, priceInDhs })
        toast({ title: 'Créé', description: 'Ville créée.' })
      }
      setOpen(false)
      load()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Opération échouée.'
      toast({ 
        title: 'Erreur', 
        description: errorMessage,
        variant: "destructive" as const
      })
      console.error("Erreur complète:", err)
    }
  }

  const handleDelete = async (city: City) => {
    const ok = window.confirm(`Supprimer la ville "${city.cityName}" ?`)
    if (!ok) return
    try {
      await deleteCity(city.id)
      toast({ title: 'Supprimé', description: 'Ville supprimée.' })
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

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            Gestion des Villes
          </h1>
          <p className="section-description">Gérer les villes et leurs tarifs de transport</p>
        </div>

        <Button onClick={onOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle ville
        </Button>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Chargement...</div>
          ) : cities.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">Aucune ville pour le moment.</p>
              <Button onClick={onOpenCreate} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Créer la première ville
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-4 px-6 font-semibold text-sm">Nom de la ville</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Prix du ticket</th>
                    <th className="text-center py-4 px-6 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.map((city) => (
                    <tr key={city.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{city.cityName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="secondary" className="gap-1">
                          <DollarSign className="w-3 h-3" />
                          {city.priceInDhs.toFixed(2)} DH
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {editing ? 'Modifier la ville' : 'Créer une nouvelle ville'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="cityName">Nom de la ville *</Label>
              <Input
                id="cityName"
                placeholder="Ex: Rabat, Casablanca, Marrakech..."
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const priceInput = document.getElementById('priceInDhs') as HTMLInputElement
                    priceInput?.focus()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Le nom de la ville sera utilisé dans les trajets et les réservations
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceInDhs">Prix du ticket (DH) *</Label>
              <Input
                id="priceInDhs"
                type="number"
                min="0"
                step="0.01"
                placeholder="5.50"
                value={priceInDhs || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  setPriceInDhs(isNaN(value) ? 0 : value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Prix en dirhams marocains (DH) pour un ticket dans cette ville
              </p>
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
