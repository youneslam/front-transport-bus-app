"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { Clock, MapPin, Check, DollarSign, AlertCircle } from 'lucide-react'
import { fetchCities } from '@/lib/api/cities'
import { fetchTrajetsByCity, fetchStationsForTrajet } from '@/lib/api/trajets'
import { formatDuration } from '@/lib/api/utils'
import { purchaseTicket } from '@/lib/api/tickets'
import type { Trajet } from '@/lib/api/trajets'
import type { City } from '@/lib/api/cities'
import type { Station } from '@/lib/api/trajets'

export default function BookingPage() {
  const router = useRouter()

  // Cities state
  const [cities, setCities] = useState<City[]>([])
  const [loadingCities, setLoadingCities] = useState(true)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)

  // Trajets state
  const [trajets, setTrajets] = useState<Trajet[]>([])
  const [loadingTrajets, setLoadingTrajets] = useState(false)
  const [selectedTrajetId, setSelectedTrajetId] = useState<number | null>(null)

  // Stations state
  const [stations, setStations] = useState<Station[]>([])
  const [loadingStations, setLoadingStations] = useState(false)

  // Purchase form state
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseMessage, setPurchaseMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Check authentication & block admins
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!token) {
      router.push("/login")
      return
    }
    if (isAdmin) {
      router.push("/dashboard/admin")
    }
  }, [router])

  // Fetch cities on mount
  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true)
      const data = await fetchCities()
      setCities(data)
      setLoadingCities(false)
    }
    loadCities()
  }, [])

  // Fetch trajets when city changes
  useEffect(() => {
    if (selectedCityId) {
      const loadTrajets = async () => {
        setLoadingTrajets(true)
        setTrajets([])
        setSelectedTrajetId(null)
        const data = await fetchTrajetsByCity(selectedCityId)
        setTrajets(data)
        setLoadingTrajets(false)
      }
      loadTrajets()
    }
  }, [selectedCityId])

  // Fetch stations when trajet changes
  useEffect(() => {
    if (selectedTrajetId) {
      const loadStations = async () => {
        setLoadingStations(true)
        const data = await fetchStationsForTrajet(selectedTrajetId)
        setStations(data)
        setLoadingStations(false)
      }
      loadStations()
    }
  }, [selectedTrajetId])

  const selectedTrajet = trajets.find(t => t.id === selectedTrajetId)
  const selectedCity = cities.find(c => c.id === selectedCityId)

  // Get userId from localStorage (or session)
  const userId = typeof window !== "undefined" ? parseInt(localStorage.getItem("userId") || "1") : 1

  const handlePurchase = async () => {
    if (!selectedTrajetId || !selectedCityId) {
      setPurchaseMessage({
        type: "error",
        text: "Veuillez sélectionner une ville et un trajet",
      })
      return
    }

    setIsPurchasing(true)
    setPurchaseMessage(null)

    const result = await purchaseTicket({
      trajetId: selectedTrajetId,
      userId: userId,
      seatNumber: "AUTO",
      selectedStartTime: "",
      cityId: selectedCityId,
    })

    setIsPurchasing(false)

    if (result.success) {
      setPurchaseMessage({
        type: "success",
        text: result.message,
      })
      // Reset form after success
      setTimeout(() => {
        setSelectedTrajetId(null)
        setSelectedCityId(null)
        setPurchaseMessage(null)
        // Optionally redirect to tickets page
        router.push("/dashboard/booking")
      }, 2000)
    } else {
      setPurchaseMessage({
        type: "error",
        text: result.message,
      })
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-header">Book Your Ticket</h1>
        <p className="section-description">Search and book your next bus journey</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Selection */}
        <div className="lg:col-span-1">
          <div className="card-premium rounded-xl p-6 sticky top-4 space-y-6">
            
            {/* City Selection */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4">1. Choisir une ville</h3>
              <select
                value={selectedCityId || ""}
                onChange={(e) => setSelectedCityId(e.target.value ? Number(e.target.value) : null)}
                disabled={loadingCities}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base disabled:opacity-50"
              >
                <option value="">Sélectionnez une ville...</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.cityName}
                  </option>
                ))}
              </select>
              {loadingCities && (
                <p className="text-sm text-muted-foreground mt-2">Chargement des villes...</p>
              )}
            </div>

            {/* Trajet Selection */}
            {selectedCity && (
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">2. Choisir un trajet</h3>
                {loadingTrajets ? (
                  <p className="text-sm text-muted-foreground">Chargement des trajets...</p>
                ) : trajets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun trajet disponible pour cette ville.</p>
                ) : (
                  <select
                    value={selectedTrajetId || ""}
                    onChange={(e) => setSelectedTrajetId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base"
                  >
                    <option value="">Sélectionnez un trajet...</option>
                    {trajets.map((trajet) => (
                      <option key={trajet.id} value={trajet.id}>
                        {trajet.nomTrajet}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Selected Trajet Summary */}
            {selectedTrajet && (
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <Check className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{selectedTrajet.nomTrajet}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {selectedTrajet.source} → {selectedTrajet.destination}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Durée: {formatDuration(selectedTrajet.dureeEstimee)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Prices & Details */}
        <div className="lg:col-span-2">
          {selectedTrajet && selectedCity ? (
            <div className="space-y-6">
              {/* Stations List */}
              {loadingStations ? (
                <div className="card-premium rounded-xl p-6">
                  <p className="text-muted-foreground">Chargement des stations...</p>
                </div>
              ) : stations.length > 0 ? (
                <div className="card-premium rounded-xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">Itinéraire et Stations</h3>
                  <div className="space-y-3">
                    {stations
                      .sort((a, b) => a.ordreDansTrajet - b.ordreDansTrajet)
                      .map((station, index) => (
                        <div key={station.id} className="flex items-start gap-4 pb-3 border-b border-border last:border-b-0">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">{station.ordreDansTrajet}</span>
                            </div>
                            {index < stations.length - 1 && (
                              <div className="w-0.5 h-12 bg-border my-1"></div>
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="font-semibold text-foreground">{station.stationName}</p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {station.estimatedMinutes} min
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}

              {/* Price & Details Card */}
              <div className="card-premium rounded-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-6">Détails et Prix</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Trajet Info */}
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-3">Informations du trajet</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nom:</span>
                        <span className="text-foreground font-medium">{selectedTrajet.nomTrajet}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Départ:</span>
                        <span className="text-foreground font-medium">{selectedTrajet.source}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Arrivée:</span>
                        <span className="text-foreground font-medium">{selectedTrajet.destination}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Durée:</span>
                        <span className="text-foreground font-medium">{formatDuration(selectedTrajet.dureeEstimee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Horaires:</span>
                        <span className="text-foreground font-medium text-xs">{selectedTrajet.startTimes?.slice(0, 3).join(', ') || 'Non spécifiés'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="p-4 border border-accent rounded-lg bg-accent/5">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-accent" />
                      Prix du billet
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Ville sélectionnée:</span>
                        <span className="text-foreground font-medium">{selectedCity.cityName}</span>
                      </div>

                      <div className="border-t border-border pt-3">
                        <div className="flex justify-between items-baseline mb-4">
                          <span className="text-lg font-semibold text-foreground">Prix:</span>
                          <span className="text-2xl font-bold text-accent">{selectedCity.priceInDhs} DH</span>
                        </div>

                        {/* Error/Success Message */}
                        {purchaseMessage && (
                          <div className={`p-3 rounded-lg mb-4 flex items-start gap-2 text-sm ${
                            purchaseMessage.type === "success"
                              ? "bg-green-500/10 border border-green-500/20 text-green-700"
                              : "bg-red-500/10 border border-red-500/20 text-red-700"
                          }`}>
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{purchaseMessage.text}</span>
                          </div>
                        )}

                        <button
                          onClick={() => handlePurchase()}
                          disabled={isPurchasing}
                          className="w-full mt-4 bg-accent text-accent-foreground py-3 rounded-lg hover:bg-accent/90 disabled:bg-accent/50 disabled:cursor-not-allowed transition-colors font-semibold"
                        >
                          {isPurchasing ? "Traitement..." : "Acheter le billet"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-premium rounded-xl p-6 text-center">
              <h3 className="text-lg font-bold text-foreground mb-2">Détails et Prix</h3>
              <p className="text-muted-foreground">Sélectionnez une ville et un trajet pour voir les détails et les prix.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}