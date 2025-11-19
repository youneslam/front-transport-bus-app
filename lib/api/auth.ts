
const API_BASE_URL = "/api"

export interface BackendUser {
  id: number
  nom: string
  email: string
  isAdmin?: boolean
  role?: string // "ADMIN" or "PASSAGER"
  // Support both 'nom' and 'name' for backward compatibility
  name?: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResult {
  token: string
  user: BackendUser
}

async function handleJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!res.ok) {
    let message = text || `HTTP ${res.status}`
    try {
      const parsed = JSON.parse(text)
      message = parsed.message || parsed.error || message
    } catch {
    }
    throw new Error(message)
  }
  return text ? (JSON.parse(text) as T) : ({} as T)
}

export async function registerUser(payload: RegisterPayload): Promise<BackendUser> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  // depending on backend implementation this might return just the user
  const data = await handleJsonResponse<any>(res)
  // Try to normalize shape
  const rawUser = data.user ?? data
  if (!rawUser || typeof rawUser.id !== "number") {
    throw new Error("Réponse d'inscription invalide (id manquant)")
  }

  // Normalize user data: handle both 'role' and 'isAdmin', and both 'nom' and 'name'
  const isAdmin = rawUser.role 
    ? rawUser.role.toUpperCase() === "ADMIN"
    : (rawUser.isAdmin === true || rawUser.isAdmin === "true")

  const user: BackendUser = {
    id: rawUser.id,
    nom: rawUser.nom || rawUser.name || "",
    name: rawUser.name || rawUser.nom || "",
    email: rawUser.email,
    isAdmin: isAdmin,
    role: rawUser.role || (isAdmin ? "ADMIN" : "PASSAGER"),
  }

  return user
}

export async function loginUser(payload: LoginPayload): Promise<LoginResult> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<any>(res)

  // Accept several common shapes:
  // { token, user: { ... } }
  // { accessToken, user: { ... } }
  // { token, id, name, email, isAdmin, role }
  const token: string =
    data.token || data.accessToken || data.jwt || data.authToken || ""

  const rawUser = data.user ?? {
    id: data.id,
    name: data.name,
    nom: data.nom,
    email: data.email,
    isAdmin: data.isAdmin,
    role: data.role,
  }

  if (!token) {
    throw new Error("Token d'authentification manquant dans la réponse du serveur")
  }
  if (!rawUser || typeof rawUser.id !== "number") {
    throw new Error("Utilisateur invalide dans la réponse du serveur")
  }

  // Normalize user data: handle both 'role' and 'isAdmin', and both 'nom' and 'name'
  const isAdmin = rawUser.role 
    ? rawUser.role.toUpperCase() === "ADMIN"
    : (rawUser.isAdmin === true || rawUser.isAdmin === "true")

  const user: BackendUser = {
    id: rawUser.id,
    nom: rawUser.nom || rawUser.name || "",
    name: rawUser.name || rawUser.nom || "",
    email: rawUser.email,
    isAdmin: isAdmin,
    role: rawUser.role || (isAdmin ? "ADMIN" : "PASSAGER"),
  }

  return { token, user }
}

export async function checkIsAdmin(userId: number): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/admin/is-admin/${userId}`)
  const data = await handleJsonResponse<any>(res)
  // Accept either { isAdmin: true } or a plain boolean
  if (typeof data === "boolean") return data
  if (typeof data.isAdmin === "boolean") return data.isAdmin
  return false
}

export async function listUsers(forceRefresh: boolean = false): Promise<BackendUser[]> {
  const token = localStorage.getItem("authToken")
  // Add cache-busting parameter if forceRefresh is true
  const url = forceRefresh 
    ? `${API_BASE_URL}/users?_t=${Date.now()}`
    : `${API_BASE_URL}/users`
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    // Force no-cache when refreshing
    cache: forceRefresh ? "no-store" : "default",
  })
  const data = await handleJsonResponse<any>(res)
  // Accept either array directly or { users: [...] }
  let users: any[] = Array.isArray(data) ? data : (Array.isArray(data.users) ? data.users : [])
  // Normalize: ensure 'nom' field exists and map 'role' to 'isAdmin'
  return users.map(user => {
    // Determine isAdmin from role if role exists, otherwise use isAdmin
    const isAdmin = user.role 
      ? user.role.toUpperCase() === "ADMIN"
      : (user.isAdmin === true || user.isAdmin === "true")
    
    return {
      ...user,
      nom: user.nom || user.name || "",
      // Keep 'name' for backward compatibility
      name: user.name || user.nom || "",
      // Map role to isAdmin for consistent usage
      isAdmin: isAdmin,
      // Keep role for reference
      role: user.role || (isAdmin ? "ADMIN" : "PASSAGER"),
    }
  })
}

export async function promoteUserToAdmin(callerId: number, targetId: number): Promise<void> {
  const token = localStorage.getItem("authToken")
  const res = await fetch(`${API_BASE_URL}/admin/promote/${callerId}/${targetId}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
  await handleJsonResponse<any>(res)
}

