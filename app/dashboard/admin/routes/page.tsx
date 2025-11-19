"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Map, Edit2, Trash2, Plus, ArrowUp, ArrowDown, X, Clock, MapPin, Route, Building2, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  listTrajets,
  createTrajet,
  updateTrajet,
  deleteTrajet,
  fetchAllTrajets,
  listStations,
  Trajet,
  Station,
} from "@/lib/api/trajets"
import { fetchCities, City } from "@/lib/api/cities"
import { createTicketAdmin } from "@/lib/api/tickets"

// Helper to get station name (handles both 'nom' and 'stationName' properties)
const getStationName = (station: Station | any): string => {
  return (station as any).nom || (station as any).stationName || "Station inconnue"
}

const getStationIdByName = (stations: Station[], name: string): number | null => {
  const found = stations.find((s) => getStationName(s) === name)
  return found ? Number((found as any).id) : null
}

const getStationCityId = (station: Station | any): number | null => {
  return (
    (station as any).cityId ??
    (station as any).city?.id ??
    (station as any).city?.cityId ??
    null
  )
}

function minutesToIso(totalMin: number) {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `PT${h > 0 ? `${h}H` : ""}${m}M`
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  // time format "HH:MM"
  const [hh, mm] = time.split(":").map((n) => parseInt(n, 10))
  if (isNaN(hh) || isNaN(mm)) return time
  const date = new Date()
  date.setHours(hh, mm, 0, 0)
  date.setMinutes(date.getMinutes() + minutesToAdd)
  const h = date.getHours().toString().padStart(2, "0")
  const m = date.getMinutes().toString().padStart(2, "0")
  return `${h}:${m}`
}

/**
 * Build schedules:
 * returns array for each startTime: list of arrival times at each station (including source as startTime)
 * e.g. for startTimes ["09:00"], stationDurations [8,12] and stations [A,B,C]:
 * returns [ ["09:00", "09:08", "09:20"] ]
 */
function computeSchedules(startTimes: string[], stationDurations: number[], stationCount: number) {
  // stationCount = number of stations selected (including source/destination)
  // stationDurations length should be stationCount (we store duration for each station entry here, but we treat them as durations from station i -> station i+1).
  // In this implementation: stationDurations.length === stationCount (we use last duration maybe 0), but we will use first stationCount-1 durations to compute arrivals.
  const schedules: string[][] = []
  for (const st of startTimes) {
    let cumul = 0
    const arrivals: string[] = []
    // first station arrival = start time
    arrivals.push(st.trim())
    for (let i = 0; i < stationCount - 1; i++) {
      const d = Number(stationDurations[i] || 0)
      cumul += d
      arrivals.push(addMinutesToTime(st.trim(), cumul))
    }
    schedules.push(arrivals)
  }
  return schedules
}

export default function AdminTrajetsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [trajets, setTrajets] = useState<Trajet[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [stations, setStations] = useState<Station[]>([])

  const [loading, setLoading] = useState(false)

  // Modal fields
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Trajet | null>(null)

  const [nomTrajet, setNomTrajet] = useState("")
  const [source, setSource] = useState("") // store station name (nom)
  const [destination, setDestination] = useState("")
  const [cityId, setCityId] = useState<number | null>(null)
  const [stationIds, setStationIds] = useState<number[]>([])
  const [stationDurations, setStationDurations] = useState<number[]>([]) // length = stationIds.length (we use first n-1 durations)
  const [startTimes, setStartTimes] = useState<string[]>([])
  const [dureeEstimee, setDureeEstimee] = useState("PT30M")

  const filteredStations = useMemo(() => {
    if (!cityId) return []
    return stations.filter((station) => getStationCityId(station) === cityId)
  }, [stations, cityId])

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!token || !isAdmin) router.push("/login")
    else load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [t, c, s] = await Promise.all([listTrajets(), fetchCities(), listStations()])
      setTrajets(t)
      setCities(c)
      setStations(s)
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de charger les trajets." })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditing(null)
    setNomTrajet("")
    setSource("")
    setDestination("")
    setCityId(null)
    setStationIds([])
    setStationDurations([])
    setStartTimes([])
    setDureeEstimee("PT30M")
  }

  useEffect(() => {
    if (!cityId) {
      if (source) setSource("")
      if (destination) setDestination("")
      if (stationIds.length > 0) setStationIds([])
      if (stationDurations.length > 0) setStationDurations([])
      return
    }

    const allowedIds = new Set(
      stations
        .filter((station) => getStationCityId(station) === cityId)
        .map((station) => Number((station as any)?.id))
        .filter((id) => !Number.isNaN(id))
    )

    const sourceId = source ? getStationIdByName(stations, source) : null
    if (source && (!sourceId || !allowedIds.has(sourceId))) {
      setSource("")
    }

    const destinationId = destination ? getStationIdByName(stations, destination) : null
    if (destination && (!destinationId || !allowedIds.has(destinationId))) {
      setDestination("")
    }

    let changed = false
    const nextIds: number[] = []
    const nextDurations: number[] = []
    stationIds.forEach((id, idx) => {
      if (allowedIds.has(id)) {
        nextIds.push(id)
        nextDurations.push(stationDurations[idx] ?? 0)
      } else {
        changed = true
      }
    })

    if (changed) {
      setStationIds(nextIds)
      setStationDurations(nextDurations)
    }
  }, [cityId, stations, stationIds, stationDurations, source, destination])

  const onOpenCreate = () => {
    resetForm()
    setOpen(true)
  }

  const onOpenEdit = (t: Trajet) => {
    setEditing(t)
    setNomTrajet(t.nomTrajet)
    setSource(t.source)
    setDestination(t.destination)
    setCityId(t.cityId)
    setStartTimes(t.startTimes ?? [])
    setDureeEstimee(t.dureeEstimee ?? "PT30M")
    // If API returns stationIds/durations in trajet, use them; otherwise set empty
    // Type assertions because Trajet interface earlier didn't include stationIds/durations — but your backend returns them for editing.
    // @ts-ignore
    setStationIds((t as any).stationIds ?? [])
    // @ts-ignore
    setStationDurations((t as any).stationDurations ?? [])
    setOpen(true)
  }

  const moveStation = (index: number, dir: "up" | "down") => {
    const n = stationIds.length
    if (dir === "up" && index === 0) return
    if (dir === "down" && index === n - 1) return
    const newIds = [...stationIds]
    const newDur = [...stationDurations]
    const swapWith = dir === "up" ? index - 1 : index + 1
    // swap ids
    ;[newIds[index], newIds[swapWith]] = [newIds[swapWith], newIds[index]]
    // swap durations — we keep durations aligned with stations
    ;[newDur[index], newDur[swapWith]] = [newDur[swapWith], newDur[index]]
    setStationIds(newIds)
    setStationDurations(newDur)
  }

  const handleAddStationToRoute = (sId: number) => {
    if (!cityId) {
      toast({ title: "Sélectionnez une ville", description: "Choisissez une ville avant d'ajouter des stations." })
      return
    }
    const station = stations.find((s) => (s as any).id === sId)
    if (!station || getStationCityId(station) !== cityId) {
      toast({
        title: "Station hors ville",
        description: "Vous ne pouvez ajouter que des stations appartenant à la ville sélectionnée.",
      })
      return
    }
    if (stationIds.includes(sId)) return
    setStationIds((prev) => [...prev, sId])
    setStationDurations((prev) => [...prev, 5]) // default 5 minutes for the new segment
  }

  const handleRemoveStationFromRoute = (index: number) => {
    const newIds = stationIds.filter((_, i) => i !== index)
    const newDur = stationDurations.filter((_, i) => i !== index)
    setStationIds(newIds)
    setStationDurations(newDur)
  }

  const recalcDureeEstimee = (durations: number[]) => {
    // We sum durations between stations (we assume durations length === stationIds.length or stationIds.length-1)
    const total = durations.reduce((a, b) => a + (Number(b) || 0), 0)
    setDureeEstimee(minutesToIso(total))
    return total
  }

  // compute preview schedules for UI
  const schedulePreview = computeSchedules(startTimes, stationDurations, stationIds.length)

  const handleSave = async () => {
    try {
      // basic validations
      if (!nomTrajet || !source || !destination || !cityId) {
        toast({ title: "Validation", description: "Tous les champs sont requis." })
        return
      }
      if (source === destination) {
        toast({ title: "Validation", description: "La source et la destination doivent être différentes." })
        return
      }
      if (stationIds.length < 2) {
        toast({ title: "Validation", description: "Choisissez au moins 2 stations pour définir un trajet complet." })
        return
      }

      const sourceStationId = getStationIdByName(stations, source)
      const destinationStationId = getStationIdByName(stations, destination)

      if (!sourceStationId || !destinationStationId) {
        toast({
          title: "Stations invalides",
          description: "Impossible de trouver les stations sélectionnées. Merci de les re-sélectionner.",
          variant: "destructive",
        })
        return
      }

      if (sourceStationId === destinationStationId) {
        toast({
          title: "Validation",
          description: "La station de départ doit être différente de la station d'arrivée.",
        })
        return
      }

      const orderedStationIds = stationIds.map((id) => Number(id))
      if (
        orderedStationIds[0] !== sourceStationId ||
        orderedStationIds[orderedStationIds.length - 1] !== destinationStationId
      ) {
        toast({
          title: "Ordre des stations",
          description: "La première station doit correspondre à la source et la dernière à la destination. Réordonnez la liste.",
          variant: "destructive",
        })
        return
      }
      // ensure stationDurations length equals stationIds.length (we store a duration per station slot; backend expects durations array length equal to stationIds length)
      // In our design, we use durations per segment (stationIds.length - 1). However earlier examples had stationDurations same length as stationIds.
      // We'll send stationDurations with same length as stationIds: if missing last element, pad with 0.
      let payloadDurations = [...stationDurations]
      if (payloadDurations.length < stationIds.length) {
        while (payloadDurations.length < stationIds.length) payloadDurations.push(0)
      } else if (payloadDurations.length > stationIds.length) {
        payloadDurations = payloadDurations.slice(0, stationIds.length)
      }

      // auto set dureeEstimee from durations
      const totalMin = recalcDureeEstimee(payloadDurations)
      const iso = minutesToIso(totalMin)

      // Ensure all required fields are valid
      if (!stationIds || stationIds.length === 0) {
        toast({ title: "Validation", description: "Veuillez sélectionner au moins une station." })
        return
      }

      // Format startTimes to ensure HH:MM format
      const formattedStartTimes = startTimes
        .filter(Boolean)
        .map(t => {
          const trimmed = t.trim()
          const parts = trimmed.split(":")
          if (parts.length === 2) {
            const hours = parts[0].padStart(2, "0")
            const minutes = parts[1].padStart(2, "0")
            return `${hours}:${minutes}`
          }
          return trimmed
        })
        .filter(t => /^\d{2}:\d{2}$/.test(t)) // Only keep valid HH:MM format

      if (formattedStartTimes.length === 0) {
        toast({ title: "Validation", description: "Veuillez saisir au moins un horaire de départ valide (format HH:MM)." })
        return
      }

      const payload = {
        nomTrajet: nomTrajet.trim(),
        sourceStationId,
        destinationStationId,
        cityId: Number(cityId),
        dureeEstimee: iso,
        stationIds: orderedStationIds,
        stationDurations: payloadDurations.map((d) => Number(d)),
        startTimes: formattedStartTimes,
      }

      // Debug: log payload before sending
      console.log("Payload envoyé:", JSON.stringify(payload, null, 2))

      if (editing) {
        await updateTrajet(editing.id, payload)
        toast({ title: "Mis à jour", description: "Trajet mis à jour." })
      } else {
        // Create trajet
        const newTrajet = await createTrajet(payload)
        toast({ title: "Créé", description: "Trajet créé." })
        
        // Automatically create a ticket for the new trajet
        try {
          const trajetId = newTrajet.id || newTrajet.trajetId || (newTrajet as any).id
          if (trajetId) {
            await createTicketAdmin({
              trajetId: trajetId,
              description: `Ticket pour le trajet ${nomTrajet}`
            })
            toast({ 
              title: "Ticket créé", 
              description: "Un ticket a été automatiquement créé pour ce trajet." 
            })
          }
        } catch (ticketError) {
          // Log error but don't fail the whole operation
          console.error("Erreur lors de la création du ticket:", ticketError)
          toast({ 
            title: "Avertissement", 
            description: "Trajet créé mais échec de la création automatique du ticket.",
            variant: "destructive" as const
          })
        }
      }

      setOpen(false)
      load()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Impossible d'enregistrer le trajet."
      toast({ 
        title: "Erreur", 
        description: errorMessage,
        variant: "destructive" as const
      })
      console.error("Erreur complète:", e)
    }
  }

  const handleDelete = async (t: Trajet) => {
    const ok = window.confirm(`Supprimer le trajet ${t.nomTrajet} ?`)
    if (!ok) return
    try {
      await deleteTrajet(t.id)
      toast({ title: "Supprimé", description: "Trajet supprimé." })
      load()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Impossible de supprimer."
      toast({ 
        title: "Erreur", 
        description: errorMessage,
        variant: "destructive" as const
      })
      console.error("Erreur complète:", e)
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Route className="w-6 h-6 text-primary" />
            </div>
            Gestion des Trajets
          </h1>
          <p className="section-description">Créer et gérer les routes de bus et leurs horaires</p>
        </div>

        <Button onClick={onOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau trajet
        </Button>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Chargement...</div>
          ) : trajets.length === 0 ? (
            <div className="py-12 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">Aucun trajet disponible.</p>
              <Button onClick={onOpenCreate} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Créer le premier trajet
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-4 px-6 font-semibold text-sm">Nom</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Source</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Destination</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Ville</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Horaires</th>
                    <th className="text-center py-4 px-6 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {trajets.map((t) => (
                    <tr key={t.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium">{t.nomTrajet}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{t.source}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{t.destination}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="outline">
                          {cities.find((c) => c.id === t.cityId)?.cityName || "N/A"}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {t.startTimes?.slice(0, 3).map((time, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {time}
                            </Badge>
                          ))}
                          {t.startTimes && t.startTimes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{t.startTimes.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => onOpenEdit(t)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>

                          <Button
                            onClick={() => handleDelete(t)}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Route className="w-5 h-5" />
              {editing ? "Modifier le trajet" : "Créer un nouveau trajet"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Basic Info Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations de base</CardTitle>
                <CardDescription>Définissez le nom, la source et la destination du trajet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="nomTrajet">Nom du trajet *</Label>
                  <Input
                    id="nomTrajet"
                    placeholder="Ex: Ligne A, Route Express..."
                    value={nomTrajet}
                    onChange={(e) => setNomTrajet(e.target.value)}
                  />
                </div>

                {/* Source / Destination */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Station Source *</Label>
                    <Select
                      value={source}
                      onValueChange={setSource}
                      disabled={!cityId || filteredStations.length === 0}
                    >
                      <SelectTrigger id="source">
                        <SelectValue
                          placeholder={
                            cityId
                              ? filteredStations.length === 0
                                ? "Aucune station pour cette ville"
                                : "Sélectionnez une station"
                              : "Choisissez d'abord une ville"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStations.map((s) => {
                          const name = getStationName(s)
                          return (
                            <SelectItem key={s.id} value={name}>
                              {name}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destination">Station Destination *</Label>
                    <Select
                      value={destination}
                      onValueChange={setDestination}
                      disabled={!cityId || filteredStations.length === 0}
                    >
                      <SelectTrigger id="destination">
                        <SelectValue
                          placeholder={
                            cityId
                              ? filteredStations.length === 0
                                ? "Aucune station pour cette ville"
                                : "Sélectionnez une station"
                              : "Choisissez d'abord une ville"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStations.map((s) => {
                          const name = getStationName(s)
                          return (
                            <SelectItem key={s.id} value={name}>
                              {name}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="cityId">Ville *</Label>
                  <Select
                    value={cityId?.toString() ?? ""}
                    onValueChange={(value) => setCityId(value ? Number(value) : null)}
                  >
                    <SelectTrigger id="cityId">
                      <SelectValue placeholder="Sélectionnez une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {c.cityName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Stations Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Itinéraire et Stations</CardTitle>
                <CardDescription>
                  Sélectionnez les stations dans l'ordre et définissez la durée entre chaque segment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Available stations */}
                <div className="space-y-3">
                  <Label>Stations disponibles</Label>
                  <div className="border rounded-lg p-3 bg-muted/30 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {!cityId ? (
                        <p className="col-span-full text-sm text-muted-foreground text-center py-4">
                          Sélectionnez une ville pour afficher ses stations.
                        </p>
                      ) : filteredStations.length === 0 ? (
                        <p className="col-span-full text-sm text-muted-foreground text-center py-4">
                          Aucune station disponible pour cette ville.
                        </p>
                      ) : (
                        filteredStations.map((s) => {
                          const name = getStationName(s)
                          return (
                            <Button
                              key={s.id}
                              variant={stationIds.includes(s.id) ? "secondary" : "outline"}
                              className="w-full justify-start"
                              onClick={() => handleAddStationToRoute(s.id)}
                              disabled={stationIds.includes(s.id)}
                            >
                              <MapPin className="w-4 h-4 mr-2 shrink-0" />
                              <span className="truncate">{name}</span>
                              {stationIds.includes(s.id) && (
                                <Badge variant="outline" className="ml-auto text-xs shrink-0">
                                  Ajouté
                                </Badge>
                              )}
                            </Button>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Ordered route with durations and reorder */}
                <div className="space-y-3">
                  <Label>Itinéraire ({stationIds.length} station{stationIds.length > 1 ? "s" : ""})</Label>
                  {stationIds.length === 0 ? (
                    <div className="border rounded-lg p-8 bg-muted/30 text-center">
                      <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Aucune station sélectionnée</p>
                      <p className="text-xs text-muted-foreground mt-1">Sélectionnez au moins 2 stations</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 bg-muted/30 max-h-[400px] overflow-y-auto space-y-3">
                        {stationIds.map((id, idx) => {
                          const st = stations.find((s) => s.id === id)
                          const stName = st ? getStationName(st) : "Station inconnue"
                          const duration = stationDurations[idx] ?? 0
                          return (
                            <Card key={id} className="p-4">
                              <div className="space-y-3">
                                {/* Station Header */}
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                                      <span className="text-sm font-bold text-primary">{idx + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-base truncate">{stName}</p>
                                      {idx === 0 && (
                                        <p className="text-xs text-muted-foreground mt-0.5">Station de départ</p>
                                      )}
                                      {idx === stationIds.length - 1 && (
                                        <p className="text-xs text-muted-foreground mt-0.5">Station d'arrivée</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => moveStation(idx, "up")}
                                      disabled={idx === 0}
                                      title="Déplacer vers le haut"
                                    >
                                      <ArrowUp className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => moveStation(idx, "down")}
                                      disabled={idx === stationIds.length - 1}
                                      title="Déplacer vers le bas"
                                    >
                                      <ArrowDown className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleRemoveStationFromRoute(idx)}
                                      title="Supprimer"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Duration Input - Only show if not last station */}
                                {idx < stationIds.length - 1 && (
                                  <div className="pt-3 border-t border-border">
                                    <Label className="text-sm font-medium mb-3 block">
                                      Durée vers la station suivante
                                    </Label>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        onClick={() => {
                                          const newD = [...stationDurations]
                                          newD[idx] = Math.max(0, (newD[idx] ?? 0) - 1)
                                          setStationDurations(newD)
                                        }}
                                        type="button"
                                      >
                                        <span className="text-lg font-bold">−</span>
                                      </Button>
                                      <div className="flex-1 min-w-[100px] max-w-[200px]">
                                        <Input
                                          type="number"
                                          min={0}
                                          step={1}
                                          className="h-9 text-center text-base font-bold w-full"
                                          value={duration}
                                          onChange={(e) => {
                                            const v = Number(e.target.value)
                                            const newD = [...stationDurations]
                                            newD[idx] = isNaN(v) || v < 0 ? 0 : v
                                            setStationDurations(newD)
                                          }}
                                          placeholder="0"
                                        />
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        onClick={() => {
                                          const newD = [...stationDurations]
                                          newD[idx] = (newD[idx] ?? 0) + 1
                                          setStationDurations(newD)
                                        }}
                                        type="button"
                                      >
                                        <span className="text-lg font-bold">+</span>
                                      </Button>
                                      <div className="px-3 py-2 bg-muted rounded-md shrink-0">
                                        <span className="text-sm font-medium text-muted-foreground">min</span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Temps de trajet de <strong>{stName}</strong> vers la station suivante
                                    </p>
                                  </div>
                                )}
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>

                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  La durée saisie correspond au temps de trajet vers la station suivante
                </p>
              </CardContent>
            </Card>

            {/* Schedule Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Horaires et Durée
                </CardTitle>
                <CardDescription>Définissez les horaires de départ et visualisez les horaires d'arrivée</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Start times */}
                <div className="space-y-2">
                  <Label htmlFor="startTimes">Horaires de départ *</Label>
                  <Input
                    id="startTimes"
                    placeholder="09:00, 13:00, 17:30 (séparés par des virgules)"
                    value={startTimes.join(", ")}
                    onChange={(e) => {
                      const times = e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                      // Format times to HH:MM (ensure 2 digits for hours)
                      const formattedTimes = times.map(time => {
                        // If time is like "9:00", convert to "09:00"
                        const parts = time.split(":")
                        if (parts.length === 2) {
                          const hours = parts[0].padStart(2, "0")
                          const minutes = parts[1].padStart(2, "0")
                          return `${hours}:${minutes}`
                        }
                        return time
                      })
                      setStartTimes(formattedTimes)
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: HH:MM (ex: 09:00, 13:00, 17:30)
                  </p>
                </div>

                {/* Auto duree totale */}
                <div className="space-y-2">
                  <Label>Durée totale estimée</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      readOnly
                      value={dureeEstimee}
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const total = recalcDureeEstimee(stationDurations)
                        toast({ 
                          title: "Durée recalculée", 
                          description: `Total: ${total} minutes (${minutesToIso(total)})` 
                        })
                      }}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Recalculer
                    </Button>
                  </div>
                </div>

                {/* Preview schedules */}
                {startTimes.length > 0 && stationIds.length > 0 && (
                  <div className="space-y-3">
                    <Label>Aperçu des horaires d'arrivée par station</Label>
                    <div className="border rounded-lg p-4 bg-muted/30 max-h-64 overflow-y-auto space-y-3">
                      {schedulePreview.map((arrivals, i) => (
                        <Card key={i} className="p-3">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="default">
                              <Clock className="w-3 h-3 mr-1" />
                              Départ: {startTimes[i]}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {arrivals.map((time, j) => {
                              const st = stations.find((s) => s.id === stationIds[j])
                              const stName = st ? getStationName(st) : `Station ${j+1}`
                              const isLast = j === arrivals.length - 1
                              return (
                                <div key={j} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-bold text-primary">{j + 1}</span>
                                    </div>
                                    <span className="font-medium">{stName}</span>
                                    {isLast && (
                                      <Badge variant="secondary" className="text-xs">Arrivée</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    <span className="font-mono font-semibold">{time}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {startTimes.length === 0 && (
                  <div className="border rounded-lg p-8 bg-muted/30 text-center">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Aucun horaire de départ renseigné</p>
                  </div>
                )}

                {startTimes.length > 0 && stationIds.length === 0 && (
                  <div className="border rounded-lg p-8 bg-muted/30 text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Sélectionnez des stations pour voir l'aperçu</p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                  Créer le trajet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
        