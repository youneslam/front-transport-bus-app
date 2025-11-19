"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from 'next/navigation'
import { MapPin, Edit2, Trash } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { createTrajet, listTrajets, updateTrajet, deleteTrajet, listStations, Trajet, Station } from '@/lib/api/trajets'
import { fetchCities, City } from '@/lib/api/cities'

const getStationLabel = (station: Station | any) => {
  return (
    (station as any)?.nom ||
    (station as any)?.stationName ||
    (station as any)?.name ||
    `Station #${(station as any)?.id ?? ''}`
  )
}

export default function AdminTrajetsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [trajets, setTrajets] = useState<Trajet[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)

  // modal state
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Trajet | null>(null)

  // form state
  const [nomTrajet, setNomTrajet] = useState('')
  const [sourceStationId, setSourceStationId] = useState<number | ''>('')
  const [destinationStationId, setDestinationStationId] = useState<number | ''>('')
  const [cityId, setCityId] = useState<number | ''>('')
  const [duree, setDuree] = useState('')
  const [selectedStationIds, setSelectedStationIds] = useState<number[]>([])
  const [stationDurationsText, setStationDurationsText] = useState('')
  const [startTimesText, setStartTimesText] = useState('')

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!token || !isAdmin) {
      router.push("/login")
    } else {
      load()
      loadExtras()
    }
  }, [router])

  const load = async () => {
    setLoading(true)
    try {
      const data = await listTrajets()
      setTrajets(data)
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de charger les trajets.' })
    } finally {
      setLoading(false)
    }
  }

  const loadExtras = async () => {
    try {
      const s = await listStations()
      setStations(s)
      const c = await fetchCities()
      setCities(c)
    } catch (err) {
      // ignore
    }
  }

  const stationNameById = useMemo(() => {
    const map = new Map<number, string>()
    stations.forEach((station) => {
      if ((station as any)?.id) {
        map.set((station as any).id, getStationLabel(station))
      }
    })
    return map
  }, [stations])

  const findStationIdByName = (name?: string | null) => {
    if (!name) return undefined
    const found = stations.find((station) => getStationLabel(station) === name)
    return found ? (found as any).id : undefined
  }

  const openCreate = () => {
    setEditing(null)
    setNomTrajet('')
    setSourceStationId('')
    setDestinationStationId('')
    setCityId('')
    setDuree('')
    setSelectedStationIds([])
    setStationDurationsText('')
    setStartTimesText('')
    setOpen(true)
  }

  const openEdit = (t: Trajet) => {
    const resolvedSourceId =
      (t as any).sourceStationId ??
      findStationIdByName(t.source) ??
      undefined
    const resolvedDestinationId =
      (t as any).destinationStationId ??
      findStationIdByName(t.destination) ??
      undefined

    setEditing(t)
    setNomTrajet(t.nomTrajet || '')
    setSourceStationId(resolvedSourceId ?? '')
    setDestinationStationId(resolvedDestinationId ?? '')
    setCityId(t.cityId || '')
    setDuree(t.dureeEstimee || '')
    const existingStationIds = Array.isArray((t as any).stationIds)
      ? ((t as any).stationIds as number[])
      : []
    setSelectedStationIds(
      existingStationIds.filter((id) => {
        if (resolvedSourceId && id === resolvedSourceId) return false
        if (resolvedDestinationId && id === resolvedDestinationId) return false
        return true
      })
    )
    setStationDurationsText((t as any).stationDurations?.join(',') || '')
    setStartTimesText((t.startTimes || []).join(','))
    setOpen(true)
  }

  const toggleStation = (id: number) => {
    setSelectedStationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (!nomTrajet.trim() || !cityId) {
      toast({ title: 'Validation', description: 'Nom et ville sont requis.' })
      return
    }
    if (!sourceStationId || !destinationStationId) {
      toast({ title: 'Validation', description: 'Veuillez choisir les stations de départ et d’arrivée.' })
      return
    }
    if (sourceStationId === destinationStationId) {
      toast({ title: 'Validation', description: 'La station de départ doit être différente de la station d’arrivée.' })
      return
    }

    const sourceIdNum = Number(sourceStationId)
    const destinationIdNum = Number(destinationStationId)
    const uniqueIntermediate = Array.from(
      new Set(
        selectedStationIds.filter(
          (id) => id !== sourceIdNum && id !== destinationIdNum
        )
      )
    )
    const orderedStationIds = [sourceIdNum, ...uniqueIntermediate, destinationIdNum]

    const stationDurationsInput = stationDurationsText.trim()
    const stationDurationsRaw = stationDurationsInput
      ? stationDurationsInput
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((val) => !Number.isNaN(val))
      : []

    const stationDurations = stationDurationsRaw.length ? stationDurationsRaw : undefined

    const startTimesInput = startTimesText.trim()
    const startTimesRaw = startTimesInput
      ? startTimesInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []

    const startTimes = startTimesRaw.length ? startTimesRaw : undefined

    const payload = {
      nomTrajet: nomTrajet.trim(),
      sourceStationId: sourceIdNum,
      destinationStationId: destinationIdNum,
      cityId: Number(cityId),
      dureeEstimee: duree.trim() || undefined,
      stationIds: orderedStationIds,
      stationDurations,
      startTimes,
    }

    try {
      if (editing) {
        const updated = await updateTrajet((editing as any).id, payload)
        toast({ title: 'Mis à jour', description: 'Trajet mis à jour.' })
        // update in-place
        setTrajets((prev) => prev.map((p) => (p.id === (editing as any).id ? updated : p)))
      } else {
        const created = await createTrajet(payload)
        toast({ title: 'Créé', description: 'Trajet créé.' })
        // optimistically add to list if API returned the created object
        if (created && (created as any).id) {
          setTrajets((prev) => [created, ...prev])
        } else {
          // fallback: reload full list
          load()
        }
      }
      setOpen(false)
    } catch (err) {
      toast({ title: 'Erreur', description: 'La sauvegarde a échoué.' })
    }
  }

  const handleDelete = async (t: Trajet) => {
    const ok = window.confirm(`Supprimer le trajet ${(t as any).nomTrajet || ''} ?`)
    if (!ok) return
    try {
      await deleteTrajet((t as any).id)
      toast({ title: 'Supprimé', description: 'Trajet supprimé.' })
      // remove from UI immediately
      setTrajets((prev) => prev.filter(p => p.id !== (t as any).id))
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer.' })
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="section-header flex items-center gap-2">
            <MapPin className="w-8 h-8" />
            Trajets Management
          </h1>
          <p className="section-description">Create and manage bus routes (trajets)</p>
        </div>

        <div>
          <button onClick={openCreate} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">Nouveau trajet</button>
        </div>
      </div>

      <div className="card-premium rounded-xl p-6 overflow-x-auto">
        {loading ? (
          <div>Chargement...</div>
        ) : trajets.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">Aucun trajet pour le moment.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Nom</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Ville</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Itinéraire</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Durée</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trajets.map((t) => {
                const sourceLabel =
                  stationNameById.get((t as any).sourceStationId) ||
                  t.source ||
                  ((t as any).sourceStationId ? `Station #${(t as any).sourceStationId}` : '—')
                const destinationLabel =
                  stationNameById.get((t as any).destinationStationId) ||
                  t.destination ||
                  ((t as any).destinationStationId ? `Station #${(t as any).destinationStationId}` : '—')
                return (
                  <tr key={(t as any).id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-4 text-foreground font-medium">{t.nomTrajet}</td>
                    <td className="py-4 px-4 text-muted-foreground text-sm">
                      {cities.find(c => c.id === t.cityId)?.cityName || t.cityId}
                    </td>
                    <td className="py-4 px-4 text-foreground text-sm">
                      {sourceLabel} → {destinationLabel}
                    </td>
                    <td className="py-4 px-4 text-foreground text-sm">{t.dureeEstimee || '—'}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => openEdit(t)} className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-muted">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t)} className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-destructive text-destructive-foreground">
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le trajet' : 'Créer un trajet'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground">Nom du trajet</label>
              <input value={nomTrajet} onChange={(e) => setNomTrajet(e.target.value)} className="input w-full mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Station de départ *</label>
                <select
                  value={sourceStationId}
                  onChange={(e) => setSourceStationId(e.target.value ? Number(e.target.value) : '')}
                  className="input w-full mt-2"
                >
                  <option value="">Choisir une station</option>
                  {stations.map((station) => (
                    <option key={(station as any).id} value={(station as any).id}>
                      {getStationLabel(station)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Station d’arrivée *</label>
                <select
                  value={destinationStationId}
                  onChange={(e) => setDestinationStationId(e.target.value ? Number(e.target.value) : '')}
                  className="input w-full mt-2"
                >
                  <option value="">Choisir une station</option>
                  {stations.map((station) => (
                    <option key={(station as any).id} value={(station as any).id}>
                      {getStationLabel(station)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Ville</label>
                <select value={cityId} onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : '')} className="input w-full mt-2">
                  <option value="">Choisir une ville</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.cityName}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Durée estimée (ex: PT2H30M)</label>
              <input value={duree} onChange={(e) => setDuree(e.target.value)} className="input w-full mt-2" />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Stations intermédiaires (sélection multiple)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-40 overflow-auto border rounded-md p-2">
                {stations.map((station) => {
                  const id = (station as any).id
                  const isSource = sourceStationId !== '' && Number(sourceStationId) === id
                  const isDestination = destinationStationId !== '' && Number(destinationStationId) === id
                  return (
                    <label key={id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isSource || isDestination || selectedStationIds.includes(id)}
                        onChange={() => toggleStation(id)}
                        disabled={isSource || isDestination}
                      />
                      <span>{getStationLabel(station)}</span>
                      {isSource && <span className="text-xs text-muted-foreground">(Départ)</span>}
                      {isDestination && <span className="text-xs text-muted-foreground">(Arrivée)</span>}
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Les stations de départ et d’arrivée sont ajoutées automatiquement. Ajoutez ici les arrêts intermédiaires, puis entrez les durées (minutes) séparées
                par des virgules dans le même ordre.
              </p>
              <input value={stationDurationsText} onChange={(e) => setStationDurationsText(e.target.value)} placeholder="ex: 5,10,7" className="input w-full mt-2" />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Horaires de départ (séparés par virgule)</label>
              <input value={startTimesText} onChange={(e) => setStartTimesText(e.target.value)} placeholder="08:00,12:30,18:00" className="input w-full mt-2" />
            </div>
          </div>

          <DialogFooter>
            <div className="w-full flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="btn">Annuler</button>
              <button onClick={handleSave} className="btn btn-primary">Enregistrer</button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
