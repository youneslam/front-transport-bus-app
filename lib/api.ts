/**
 * API Types & Services
 * Centralized interfaces and fetch functions for booking/ticketing system
 */

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_GATEWAY_URL || "/api").replace(/\/$/, "")
const withGateway = (path: string) => `${API_BASE_URL}${path}`

export interface Trajet {
  id: number
  nomTrajet: string
  source?: string
  destination?: string
  sourceStationId?: number
  destinationStationId?: number
  dureeEstimee: string
  cityId: number
  stationNames: string[]
  startTimes: string[]
}

export interface City {
  id: number
  cityName: string
  priceInDhs: number
}

export interface Station {
  id: number
  trajetId?: number
  stationId?: number
  stationName?: string
  ordreDansTrajet?: number
  estimatedMinutes?: number
  nom?: string
  cityId?: number
  city?: City | { id: number; cityName: string }
}

export interface TicketPurchase {
  trajetId: number
  userId: number
  seatNumber: string
  selectedStartTime: string
  cityId: number
}

export interface PurchaseResponse {
  success: boolean
  message: string
  ticketId?: number
}

// ============= SUBSCRIPTIONS =============

export interface SubscriptionCity {
  id: number
  name: string
  monthlyPriceNormal: number
  yearlyPriceNormal: number
}
// ============= UTILITY FUNCTIONS =============

export const formatDuration = (duration: string): string => {
  const match = duration?.match(/PT(\d+)H?(\d+)?M/) || null
  if (!match) return duration || ''
  const hours = match[1] ? `${match[1]}h` : ''
  const minutes = match[2] ? `${match[2]}min` : ''
  return `${hours}${minutes}`.trim()
}

// ============= API SERVICES =============

/**
 * Fetch all available cities
 */
export const fetchCities = async (): Promise<City[]> => {
  try {
    const response = await fetch(withGateway("/trajet-cities"))
    if (!response.ok) throw new Error("Failed to fetch cities")
    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des villes:", error)
    return []
  }
}

/**
 * Fetch all trajets (bus routes)
 */
export const fetchAllTrajets = async (): Promise<Trajet[]> => {
  try {
    const response = await fetch("/api/trajets")
    if (!response.ok) throw new Error("Failed to fetch trajets")
    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des trajets:", error)
    return []
  }
}

/**
 * Fetch trajets filtered by city
 */
export const fetchTrajetsByCity = async (cityId: number): Promise<Trajet[]> => {
  try {
    const allTrajets = await fetchAllTrajets()
    return allTrajets.filter((t) => t.cityId === cityId)
  } catch (error) {
    console.error("Erreur lors du filtrage des trajets:", error)
    return []
  }
}

/**
 * Fetch stations for a specific trajet
 */
export const fetchStationsForTrajet = async (trajetId: number): Promise<Station[]> => {
  try {
    const response = await fetch(`/api/trajet-stations/by-trajet/${trajetId}`)
    if (!response.ok) throw new Error("Failed to fetch stations")
    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des stations:", error)
    return []
  }
}

/**
 * Purchase a ticket
 */
export const purchaseTicket = async (data: TicketPurchase): Promise<PurchaseResponse> => {
  try {
    const response = await fetch("/api/tickets/achats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ticketId: data.trajetId,
        userId: data.userId,
        seatNumber: data.seatNumber,
        selectedStartTime: data.selectedStartTime,
        cityId: data.cityId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de l'achat du ticket")
    }

    const result = await response.json()
    return {
      success: true,
      message: "Ticket acheté avec succès!",
      ticketId: result.ticketId || result.id,
    }
  } catch (error) {
    console.error("Erreur lors de l'achat du ticket:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur est survenue lors de l'achat",
    }
  }
}

/**
 * Fetch subscription cities (list)
 */
export const fetchSubscriptionCities = async (): Promise<SubscriptionCity[]> => {
  try {
    const res = await fetch("/api/abonnements/cities")
    if (!res.ok) throw new Error("Failed to fetch subscription cities")
    return await res.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des villes d'abonnement:", error)
    return []
  }
}

/**
 * Fetch subscription pricing/details for a specific city
 */
export const fetchSubscriptionForCity = async (cityId: number): Promise<SubscriptionCity | null> => {
  try {
    const res = await fetch(`/api/abonnements/cities/${cityId}`)
    if (!res.ok) throw new Error("Failed to fetch subscription for city")
    return await res.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des abonnements pour la ville:", error)
    return null
  }
}

/**
 * Create a subscription city
 */
export interface CreateSubscriptionCityRequest {
  id?: number
  name: string
  monthlyPriceNormal: number
  yearlyPriceNormal: number
}

export const createSubscriptionCity = async (payload: CreateSubscriptionCityRequest): Promise<SubscriptionCity> => {
  try {
    const res = await fetch('/api/abonnements/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage = 'Failed to create subscription city'
      try {
        const err = JSON.parse(errorText)
        errorMessage = err.message || err.error || errorText || errorMessage
      } catch {
        errorMessage = errorText || `Server error: ${res.status} ${res.statusText}`
      }
      console.error('Erreur serveur lors de la création:', errorMessage)
      throw new Error(errorMessage)
    }
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la création de la ville d\'abonnement:', error)
    throw error
  }
}

/**
 * Update a subscription city
 */
export interface UpdateSubscriptionCityRequest {
  name?: string
  monthlyPriceNormal?: number
  yearlyPriceNormal?: number
}

export const updateSubscriptionCity = async (id: number, payload: UpdateSubscriptionCityRequest): Promise<SubscriptionCity> => {
  try {
    const res = await fetch(`/api/abonnements/cities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage = 'Failed to update subscription city'
      try {
        const err = JSON.parse(errorText)
        errorMessage = err.message || err.error || errorText || errorMessage
      } catch {
        errorMessage = errorText || `Server error: ${res.status} ${res.statusText}`
      }
      console.error('Erreur serveur lors de la mise à jour:', errorMessage)
      throw new Error(errorMessage)
    }
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la ville d\'abonnement:', error)
    throw error
  }
}

/**
 * Delete a subscription city
 */
export const deleteSubscriptionCity = async (id: number): Promise<boolean> => {
  try {
    const res = await fetch(`/api/abonnements/cities/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage = 'Failed to delete subscription city'
      try {
        const err = JSON.parse(errorText)
        errorMessage = err.message || err.error || errorText || errorMessage
      } catch {
        errorMessage = errorText || `Server error: ${res.status} ${res.statusText}`
      }
      console.error('Erreur serveur lors de la suppression:', errorMessage)
      throw new Error(errorMessage)
    }
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression de la ville d\'abonnement:', error)
    throw error
  }
}

/**
 * List all subscription cities (alias for fetchSubscriptionCities for consistency)
 */
export const listSubscriptionCities = fetchSubscriptionCities

// ============= SUBSCRIPTION PURCHASE =============

export interface SubscriptionPurchaseRequest {
  userId: number
  cityId: number
  type: 'MONTHLY' | 'YEARLY'
}

export interface SubscriptionPurchaseResponse {
  id: number
  userId: number
  type: string
  startDate: string
  endDate: string
  active: boolean
  city: SubscriptionCity
}

/**
 * Fetch all subscriptions for a user
 * GET /api/abonnements/user/{userId}
 */
export const fetchUserSubscriptions = async (userId: number): Promise<SubscriptionPurchaseResponse[]> => {
  try {
    const res = await fetch(`/api/abonnements/user/${userId}`)
    if (!res.ok) {
      // if 404 or no subscriptions, return empty array
      return []
    }
    const data = await res.json()
    // Backend returns array, ensure we handle both array and single object
    const subscriptions = Array.isArray(data) ? data : [data]
    return subscriptions as SubscriptionPurchaseResponse[]
  } catch (error) {
    console.error("Erreur lors de la récupération des abonnements de l'utilisateur:", error)
    return []
  }
}

/**
 * Fetch current active subscription for a user (if any)
 * GET /api/abonnements/user/{userId} and filter for active ones
 */
export const fetchCurrentSubscription = async (userId: number): Promise<SubscriptionPurchaseResponse | null> => {
  try {
    const subscriptions = await fetchUserSubscriptions(userId)
    // Return the first active subscription (should be only one based on backend logic)
    const activeSubscription = subscriptions.find(sub => sub.active === true)
    return activeSubscription || null
  } catch (error) {
    console.error("Erreur lors de la récupération de l'abonnement actif de l'utilisateur:", error)
    return null
  }
}

/**
 * Purchase a subscription
 * POST /api/abonnements
 */
export const purchaseSubscription = async (data: SubscriptionPurchaseRequest): Promise<{
  success: boolean
  message: string
  subscription?: SubscriptionPurchaseResponse | null
}> => {
  try {
    const res = await fetch('/api/abonnements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      const msg = err?.message || 'Erreur lors de l\'achat de l\'abonnement'
      throw new Error(msg)
    }

    const result = (await res.json()) as SubscriptionPurchaseResponse
    return {
      success: true,
      message: 'Abonnement créé avec succès',
      subscription: result,
    }
  } catch (error) {
    console.error('Erreur lors de l\'achat de l\'abonnement:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Une erreur est survenue',
      subscription: null,
    }
  }
}

// ============= PAYMENTS =============

export interface PaymentIntentRequest {
  type: 'TICKET' | 'SUBSCRIPTION'
  referenceId: number
  amount: number
  userId: number
  currency?: string
}

export interface PaymentIntentResponse {
  id: number
  status?: string
  paymentUrl?: string
  clientSecret?: string
  amount: number
  type: string
  referenceId: number
}

/**
 * Create a payment intent (used for subscriptions or tickets)
 * POST /api/payments
 */
export const createPaymentIntent = async (
  payload: PaymentIntentRequest,
): Promise<PaymentIntentResponse> => {
  try {
    const requestBody = {
      ...payload,
      currency: payload.currency ?? 'USD',
    }

    const res = await fetch(withGateway('/payments'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    if (!res.ok) {
      const errorText = await res.text()
      let message = 'Erreur lors de la création du paiement'
      try {
        const parsed = JSON.parse(errorText)
        message = parsed.message || parsed.error || message
      } catch {
        message = errorText || message
      }
      throw new Error(message)
    }

    return (await res.json()) as PaymentIntentResponse
  } catch (error) {
    console.error('Erreur lors de la création du paiement:', error)
    throw error
  }
}

// ============= USER TICKETS =============

export interface UserTicket {
  id: number
  ticketId: number
  userId: number
  userName: string
  valid: boolean
  createdAt: string
  validatedAt: string | null
}

/**
 * Fetch tickets purchased by a user
 * Endpoint: GET /api/tickets/achats/users/{userId}
 */
export const fetchUserTickets = async (userId: number): Promise<UserTicket[]> => {
  try {
    const res = await fetch(`/api/tickets/achats/users/${userId}`)
    if (!res.ok) {
      const err = await res.text().catch(() => 'Failed to fetch user tickets')
      throw new Error(err || 'Failed to fetch user tickets')
    }
    const data = await res.json()
    return data as UserTicket[]
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets utilisateur:', error)
    return []
  }
}

// ============= ADMIN / CRUD HELPERS =============

export interface CreateTrajetRequest {
  nomTrajet: string
  sourceStationId: number
  destinationStationId: number
  cityId: number
  dureeEstimee?: string
  stationIds?: number[]
  stationDurations?: number[]
  startTimes?: string[]
}

export const createTrajet = async (payload: CreateTrajetRequest) => {
  try {
    const res = await fetch('/api/trajets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage = 'Failed to create trajet'
      try {
        const err = JSON.parse(errorText)
        errorMessage = err.message || err.error || errorText || errorMessage
      } catch {
        errorMessage = errorText || `Server error: ${res.status} ${res.statusText}`
      }
      console.error('Erreur serveur:', errorMessage)
      throw new Error(errorMessage)
    }
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la création du trajet:', error)
    throw error
  }
}

export const listTrajets = async (): Promise<Trajet[]> => {
  try {
    const res = await fetch('/api/trajets')
    if (!res.ok) throw new Error('Failed to fetch trajets')
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la récupération des trajets:', error)
    return []
  }
}

export const getTrajetById = async (id: number): Promise<Trajet | null> => {
  try {
    const res = await fetch(`/api/trajets/${id}`)
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la récupération du trajet:', error)
    return null
  }
}

export const listTrajetsByCity = async (cityId: number): Promise<Trajet[]> => {
  try {
    const res = await fetch(`/api/trajets/city/${cityId}`)
    if (!res.ok) throw new Error('Failed to fetch trajets by city')
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la récupération des trajets par ville:', error)
    return []
  }
}

export const getTrajetSchedules = async (trajetId: number) => {
  try {
    const res = await fetch(`/api/trajets/${trajetId}/schedules`)
    if (!res.ok) throw new Error('Failed to fetch trajet schedules')
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la récupération des horaires du trajet:', error)
    return []
  }
}

export const updateTrajet = async (id: number, payload: CreateTrajetRequest) => {
  try {
    const res = await fetch(`/api/trajets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to update trajet' }))
      throw new Error(err.message || 'Failed to update trajet')
    }
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la mise à jour du trajet:', error)
    throw error
  }
}

export const deleteTrajet = async (id: number) => {
  try {
    const res = await fetch(`/api/trajets/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage = 'Failed to delete trajet'
      try {
        const err = JSON.parse(errorText)
        errorMessage = err.message || err.error || errorText || errorMessage
      } catch {
        errorMessage = errorText || `Server error: ${res.status} ${res.statusText}`
      }
      console.error('Erreur serveur lors de la suppression du trajet:', errorMessage)
      throw new Error(errorMessage)
    }
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression du trajet:', error)
    throw error
  }
}

// Stations
export interface CreateStationRequest {
  nom: string
  cityId: number
}

export const createStation = async (payload: CreateStationRequest) => {
  try {
    const res = await fetch('/api/stations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create station' }))
      throw new Error(err.message || 'Failed to create station')
    }
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la création de la station:', error)
    throw error
  }
}

export const listStations = async (): Promise<Station[]> => {
  try {
    const res = await fetch('/api/stations')
    if (!res.ok) throw new Error('Failed to fetch stations')
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la récupération des stations:', error)
    return []
  }
}

export const updateStation = async (id: number, payload: CreateStationRequest) => {
  try {
    const res = await fetch(`/api/stations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to update station' }))
      throw new Error(err.message || 'Failed to update station')
    }
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la station:', error)
    throw error
  }
}

export const deleteStation = async (id: number) => {
  try {
    const res = await fetch(`/api/stations/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage = 'Failed to delete station'
      try {
        const err = JSON.parse(errorText)
        errorMessage = err.message || err.error || errorText || errorMessage
      } catch {
        errorMessage = errorText || `Server error: ${res.status} ${res.statusText}`
      }
      console.error('Erreur serveur lors de la suppression de la station:', errorMessage)
      throw new Error(errorMessage)
    }
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression de la station:', error)
    throw error
  }
}

// Cities
export interface CreateCityRequest {
  cityName: string
  priceInDhs: number
}

export const createCity = async (payload: CreateCityRequest) => {
  try {
    const res = await fetch('/api/trajet-cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create city' }))
      throw new Error(err.message || 'Failed to create city')
    }
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la création de la ville:', error)
    throw error
  }
}

export const listCities = async (): Promise<City[]> => {
  try {
    const res = await fetch('/api/trajet-cities')
    if (!res.ok) throw new Error('Failed to fetch cities')
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la récupération des villes:', error)
    return []
  }
}

export const getCityById = async (id: number): Promise<City | null> => {
  try {
    const res = await fetch(`/api/trajet-cities/${id}`)
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la récupération de la ville:', error)
    return null
  }
}

export const updateCity = async (id: number, payload: CreateCityRequest) => {
  try {
    const res = await fetch(`/api/trajet-cities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to update city' }))
      throw new Error(err.message || 'Failed to update city')
    }
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la ville:', error)
    throw error
  }
}

export const deleteCity = async (id: number) => {
  try {
    const res = await fetch(`/api/trajet-cities/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage = 'Failed to delete city'
      try {
        const err = JSON.parse(errorText)
        errorMessage = err.message || err.error || errorText || errorMessage
      } catch {
        errorMessage = errorText || `Server error: ${res.status} ${res.statusText}`
      }
      console.error('Erreur serveur lors de la suppression:', errorMessage)
      throw new Error(errorMessage)
    }
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression de la ville:', error)
    throw error
  }
}

// Tickets (via API gateway)
export interface CreateTicketRequest {
  trajetId: number
  description?: string
}

export interface AdminTicket {
  id: number
  trajetId: number
  nomTrajet: string
  cityName: string
  price: number
  description: string | null
  createdAt: string
}

export const createTicketAdmin = async (payload: CreateTicketRequest) => {
  try {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create ticket' }))
      throw new Error(err.message || 'Failed to create ticket')
    }
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la création du ticket:', error)
    throw error
  }
}

export const listTickets = async (): Promise<AdminTicket[]> => {
  try {
    const res = await fetch('/api/tickets')
    if (!res.ok) throw new Error('Failed to fetch tickets')
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets:', error)
    return []
  }
}

export interface UpdateTicketRequest {
  description?: string
}

export const updateTicket = async (id: number, payload: UpdateTicketRequest) => {
  try {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage = 'Failed to update ticket'
      try {
        const err = JSON.parse(errorText)
        errorMessage = err.message || err.error || errorText || errorMessage
      } catch {
        errorMessage = errorText || `Server error: ${res.status} ${res.statusText}`
      }
      console.error('Erreur serveur lors de la mise à jour du ticket:', errorMessage)
      throw new Error(errorMessage)
    }
    return await res.json()
  } catch (error) {
    console.error('Erreur lors de la mise à jour du ticket:', error)
    throw error
  }
}

