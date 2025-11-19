"use client"

import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, BusFront, Route } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { BusService, BusEntity, BusPayload } from "@/services/bus-service"
import { listTrajets, Trajet } from "@/lib/api/trajets"

interface FormState {
  matricule: string
  description: string
  trajetId: string
}

const defaultForm: FormState = {
  matricule: "",
  description: "",
  trajetId: "",
}

export function AdminBusManager() {
  const { toast } = useToast()
  const [buses, setBuses] = useState<BusEntity[]>([])
  const [trajets, setTrajets] = useState<Trajet[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [editingBus, setEditingBus] = useState<BusEntity | null>(null)

  const loadBuses = async () => {
    setLoading(true)
    try {
      const data = await BusService.list()
      setBuses(data)
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de charger les bus.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBuses()
    loadTrajets()
  }, [])

  const loadTrajets = async () => {
    try {
      const data = await listTrajets()
      setTrajets(data)
    } catch (error) {
      console.error("Erreur lors du chargement des trajets:", error)
    }
  }

  const openCreateModal = () => {
    setEditingBus(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEditModal = (bus: BusEntity) => {
    setEditingBus(bus)
    setForm({
      matricule: bus.matricule,
      description: bus.description || "",
      trajetId: bus.trajetId?.toString() || "",
    })
    setModalOpen(true)
  }

  const onChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.matricule.trim() || !form.trajetId.trim()) {
      toast({
        title: "Validation",
        description: "Le matricule et le trajet sont requis.",
      })
      return
    }
    const payload: BusPayload = {
      matricule: form.matricule.trim(),
      description: form.description.trim() || "",
      trajetId: Number(form.trajetId),
    }
    
    // Debug: log payload
    console.log("Payload envoyé:", JSON.stringify(payload, null, 2))
    
    try {
      if (editingBus) {
        await BusService.update(editingBus.id, payload)
        toast({ title: "Bus mis à jour" })
      } else {
        await BusService.create(payload)
        toast({ title: "Bus créé" })
      }
      setModalOpen(false)
      loadBuses()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (bus: BusEntity) => {
    if (!window.confirm(`Supprimer le bus ${bus.matricule} ?`)) return
    try {
      await BusService.delete(bus.id)
      toast({ title: "Bus supprimé" })
      loadBuses()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Suppression impossible.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card className="p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase text-muted-foreground font-semibold">Gestion des bus</p>
            <h2 className="text-2xl font-bold flex items-center gap-2 mt-1">
              <BusFront className="w-6 h-6 text-primary" />
              Flotte connectée
            </h2>
            <p className="text-sm text-muted-foreground">
              Créez, mettez à jour ou supprimez les bus actifs. Les données sont synchronisées avec le backend.
            </p>
          </div>

          <Button className="gap-2" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Nouveau bus
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border text-muted-foreground uppercase text-xs">
                <th className="py-3 pr-4">Matricule</th>
                <th className="py-3 pr-4">Description</th>
                <th className="py-3 pr-4">Trajet</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    Chargement des bus...
                  </td>
                </tr>
              ) : buses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    Aucun bus pour le moment.
                  </td>
                </tr>
              ) : (
                buses.map((bus) => {
                  const trajet = trajets.find((t) => t.id === bus.trajetId)
                  return (
                    <tr key={bus.id} className="border-b border-border/60">
                      <td className="py-3 font-semibold">{bus.matricule}</td>
                      <td className="py-3 text-muted-foreground">{bus.description || "—"}</td>
                      <td className="py-3">
                        {trajet ? (
                          <div className="flex items-center gap-2">
                            <Route className="w-4 h-4 text-muted-foreground" />
                            <span>{trajet.nomTrajet}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">ID: {bus.trajetId ?? "—"}</span>
                        )}
                      </td>
                      <td className="py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditModal(bus)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(bus)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBus ? "Modifier le bus" : "Créer un bus"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="matricule">Matricule *</Label>
              <Input
                id="matricule"
                value={form.matricule}
                onChange={(event) => onChange("matricule", event.target.value)}
                placeholder="BUS-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trajetId">Trajet *</Label>
              <Select
                value={form.trajetId}
                onValueChange={(value) => onChange("trajetId", value)}
                disabled={trajets.length === 0}
              >
                <SelectTrigger id="trajetId">
                  <SelectValue placeholder={trajets.length === 0 ? "Aucun trajet disponible" : "Sélectionnez un trajet"} />
                </SelectTrigger>
                <SelectContent>
                  {trajets.map((trajet) => (
                    <SelectItem key={trajet.id} value={trajet.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-muted-foreground" />
                        <span>{trajet.nomTrajet}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {trajets.length === 0 && (
                <p className="text-xs text-muted-foreground">Créez d'abord un trajet pour pouvoir assigner un bus.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(event) => onChange("description", event.target.value)}
                placeholder="Bus 50 places, climatisé..."
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} className="gap-2">
              {editingBus ? (
                <>
                  <Edit2 className="w-4 h-4" />
                  Mettre à jour
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

