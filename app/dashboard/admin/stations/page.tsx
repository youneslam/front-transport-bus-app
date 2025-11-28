"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { MapPin, Edit2, Trash2, Plus, Route, Building2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { listCities, City } from "@/lib/api/cities"
import { createStation, listStations, updateStation, deleteStation, Station } from '@/lib/api/trajets'

// Helper to get station name (handles both 'nom' and 'stationName' properties)
const getStationName = (station: Station | any): string => {
  return (station as any).nom || (station as any).stationName || "Station inconnue"
}

const getStationCityId = (station: Station | any): number | null => {
  if (!station) return null
  return (
    (station as any).cityId ??
    (station as any).city?.id ??
    (station as any).city?.cityId ??
    null
  )
}

const getStationCityName = (station: Station | any, cities: City[]): string => {
  const directName =
    (station as any).city?.cityName ||
    (station as any).cityName ||
    null
  if (directName) return directName
  const cityId = getStationCityId(station)
  if (!cityId) return "Non définie"
  return cities.find((c) => c.id === cityId)?.cityName ?? "Non définie"
}

export default function AdminStationsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [stations, setStations] = useState<Station[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)

  // modal state
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Station | null>(null)
  const [name, setName] = useState('')
  const [modalCityId, setModalCityId] = useState<number | null>(null)
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')
  const [filterCityId, setFilterCityId] = useState<string>('all')

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!token || !isAdmin) {
      router.push("/login")
    } else {
      loadStations()
      loadCities()
    }
  }, [router])

  const loadStations = async () => {
    setLoading(true)
    try {
      const data = await listStations()
      setStations(data)
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de charger les stations.' })
    } finally {
      setLoading(false)
    }
  }

  const loadCities = async () => {
    try {
      const data = await listCities()
      setCities(data)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erreur', description: 'Impossible de charger les villes.' })
    }
  }

  const onOpenCreate = () => {
    setEditing(null)
    setName('')
    setModalCityId(null)
    setLatitude('')
    setLongitude('')
    setOpen(true)
  }

  const onOpenEdit = (s: Station) => {
    setEditing(s)
    setName(getStationName(s))
    setModalCityId(getStationCityId(s))
    setLatitude(s.latitude?.toString() || '')
    setLongitude(s.longitude?.toString() || '')
    setOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        toast({ title: 'Validation', description: 'Le nom est requis.' })
        return
      }
      if (!modalCityId) {
        toast({ title: 'Validation', description: 'Veuillez sélectionner une ville.' })
        return
      }

      const payload = {
        nom: name.trim(),
        cityId: modalCityId,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined
      }
      if (editing) {
        await updateStation((editing as any).id, payload)
        toast({ title: 'Mis à jour', description: 'Station mise à jour.' })
      } else {
        await createStation(payload)
        toast({ title: 'Créé', description: 'Station créée.' })
      }
      setOpen(false)
      loadStations()
    } catch (err) {
      toast({ title: 'Erreur', description: 'Opération échouée.' })
    }
  }

  const handleDelete = async (s: Station) => {
    const stationName = getStationName(s)
    const ok = window.confirm(`Supprimer la station "${stationName}" ?`)
    if (!ok) return
    try {
      await deleteStation((s as any).id)
      toast({ title: 'Supprimé', description: 'Station supprimée.' })
      loadStations()
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

  const filteredStations =
    filterCityId === 'all'
      ? stations
      : stations.filter((station) => {
        const cityId = getStationCityId(station)
        return cityId !== null && cityId.toString() === filterCityId
      })

  const emptyStateMessage =
    stations.length === 0
      ? 'Aucune station pour le moment.'
      : 'Aucune station ne correspond à cette ville.'

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            Gestion des Stations
          </h1>
          <p className="section-description">Gérer les stations de bus, leur capacité et leurs équipements</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={filterCityId} onValueChange={setFilterCityId}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Toutes les villes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les villes</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    {city.cityName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={onOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle station
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Chargement...</div>
          ) : filteredStations.length === 0 ? (
            <div className="py-12 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">{emptyStateMessage}</p>
              {stations.length === 0 && (
                <Button onClick={onOpenCreate} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer la première station
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-4 px-6 font-semibold text-sm">Nom</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Ville</th>
                    <th className="text-center py-4 px-6 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStations.map((station) => {
                    const stationName = getStationName(station)
                    const cityName = getStationCityName(station, cities)
                    return (
                      <tr key={(station as any).id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{stationName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            {cityName}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => onOpenEdit(station)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(station)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {editing ? 'Modifier la station' : 'Créer une nouvelle station'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="stationName">Nom de la station *</Label>
              <Input
                id="stationName"
                placeholder="Ex: Station Centrale, Gare du Nord..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Le nom de la station sera utilisé dans les trajets et les réservations
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stationCity">Ville *</Label>
              <Select
                value={modalCityId?.toString() ?? ""}
                onValueChange={(value) => setModalCityId(value ? Number(value) : null)}
                disabled={cities.length === 0}
              >
                <SelectTrigger id="stationCity">
                  <SelectValue placeholder={cities.length === 0 ? "Aucune ville disponible" : "Sélectionnez une ville"} />
                </SelectTrigger>
                <SelectContent>
                  {cities.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Aucune ville disponible
                    </SelectItem>
                  ) : (
                    cities.map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {city.cityName}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Associez la station à l'une des villes existantes pour faciliter les filtres et rapports
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  placeholder="Ex: 36.8065"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  placeholder="Ex: 10.1815"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
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
                  Créer la station
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
