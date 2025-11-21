# Configuration Backend - Endpoints Réels

## 🎯 Backend Spring Boot (Port 8080)

### Endpoints Bus (BusController)

**Base URL**: `/api/buses`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/buses` | Créer un nouveau bus |
| `GET` | `/api/buses` | Lister tous les bus |
| `GET` | `/api/buses/{id}` | Obtenir un bus par ID |
| `PUT` | `/api/buses/{id}` | Mettre à jour un bus |
| `DELETE` | `/api/buses/{id}` | Supprimer un bus |

**Exemple Request**:
```bash
# Créer un bus
curl -X POST http://localhost:8080/api/buses \
  -H "Content-Type: application/json" \
  -d '{
    "matricule": "TUN-123",
    "description": "Bus ligne 1",
    "trajetId": 1
  }'

# Lister tous les bus
curl http://localhost:8080/api/buses

# Obtenir un bus spécifique
curl http://localhost:8080/api/buses/1
```

---

### Endpoints Location (BusLocationController)

**Base URL**: `/api/location`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/location/update` | Mettre à jour la position d'un bus |
| `GET` | `/api/location/latest/{busId}` | Récupérer la dernière position |

**Exemple Request**:
```bash
# Mettre à jour la position
curl -X POST http://localhost:8080/api/location/update \
  -H "Content-Type: application/json" \
  -d '{
    "busId": 1,
    "latitude": 36.8065,
    "longitude": 10.1815,
    "timestamp": 1700000000000
  }'

# Récupérer la dernière position
curl http://localhost:8080/api/location/latest/1
```

**Comportement de `/api/location/update`**:
1. Valide que le bus existe
2. Sauvegarde dans PostgreSQL (historique)
3. Met à jour Redis (dernière position, clé: `bus:{busId}`)
4. **Broadcast WebSocket** vers `/topic/bus-location`

---

### WebSocket Configuration

**Endpoint**: `ws://localhost:8080/ws`  
**Protocole**: STOMP over SockJS  
**Topic de broadcast**: `/topic/bus-location`

**Message diffusé**:
```json
{
  "busId": 1,
  "latitude": 36.8065,
  "longitude": 10.1815,
  "timestamp": 1700000000000
}
```

---

## 🌐 Configuration Frontend (Next.js)

### Proxy Next.js (`next.config.mjs`)

```javascript
async rewrites() {
  return [
    // API Géolocalisation Bus → Port 8080
    {
      source: '/api/buses/:path*',
      destination: 'http://localhost:8080/api/buses/:path*',
    },
    {
      source: '/api/location/:path*',
      destination: 'http://localhost:8080/api/location/:path*',
    },
    // Toutes les autres APIs → Port 4004
    {
      source: '/api/:path*',
      destination: 'http://localhost:4004/api/:path*',
    },
  ]
}
```

### Variables d'environnement (`.env.local`)

```env
# WebSocket URL (connexion directe au backend géolocalisation)
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws

# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 💻 Utilisation Frontend

### BusService
```typescript
import { BusService } from "@/services/bus"

// Lister tous les bus
const buses = await BusService.list()
// → GET /api/buses → http://localhost:8080/api/buses

// Créer un bus
const bus = await BusService.create({
  matricule: "TUN-123",
  description: "Bus ligne 1",
  trajetId: 1
})
// → POST /api/buses → http://localhost:8080/api/buses
```

### LocationService
```typescript
import { LocationService } from "@/services/bus"

// Mettre à jour la position
await LocationService.updateLocation({
  busId: 1,
  latitude: 36.8065,
  longitude: 10.1815,
  timestamp: Date.now()
})
// → POST /api/location/update → http://localhost:8080/api/location/update

// Récupérer la dernière position
const location = await LocationService.getLatestLocation(1)
// → GET /api/location/latest/1 → http://localhost:8080/api/location/latest/1
```

### WebSocket (busSocketService)
```typescript
import { busSocketService } from "@/services/bus"

// S'abonner aux mises à jour en temps réel
const unsubscribe = busSocketService.addListener((payload) => {
  console.log(`Bus ${payload.busId}:`, payload.latitude, payload.longitude)
})

// Nettoyage
return unsubscribe
```

---

## 🚀 Démarrage

### 1. Backend Spring Boot
```bash
# Depuis le dossier geolocalisation-service
./mvnw spring-boot:run
# Devrait démarrer sur http://localhost:8080
```

### 2. Frontend Next.js
```bash
# Depuis le dossier du projet frontend
npm run dev
# Devrait démarrer sur http://localhost:3000
```

### 3. Vérification
```bash
# Test backend direct
curl http://localhost:8080/api/buses

# Test via proxy Next.js
curl http://localhost:3000/api/buses
```

---

## 🔍 Architecture Complète

```
Frontend (Next.js :3000)
  ├─ BusService → /api/buses → Next.js Proxy → Backend :8080/api/buses
  ├─ LocationService → /api/location → Next.js Proxy → Backend :8080/api/location
  └─ busSocketService → ws://localhost:8080/ws (connexion directe)

Backend Géolocalisation (:8080)
  ├─ BusController (/api/buses)
  ├─ BusLocationController (/api/location)
  ├─ WebSocket (/ws)
  ├─ PostgreSQL (historique positions)
  └─ Redis (cache dernière position)

Backend Principal (:4004)
  └─ Autres APIs (auth, payment, etc.)
```

---

## ✅ Checklist

- [x] Backend Spring Boot configuré sur port 8080
- [x] PostgreSQL et Redis accessibles
- [x] Next.js proxy configuré pour router vers les bons backends
- [x] Services frontend alignés avec les endpoints backend
- [x] WebSocket configuré pour connexion directe
- [ ] Les deux backends sont démarrés
- [ ] Tester la création d'un bus
- [ ] Tester la mise à jour de position
- [ ] Vérifier la réception WebSocket

---

## 🐛 Points d'Attention

1. **Ordre des rewrites dans Next.js** : Les routes spécifiques (`/api/buses`, `/api/location`) doivent être AVANT la route générique (`/api/:path*`)

2. **WebSocket** : Connexion directe à `localhost:8080/ws`, pas de proxy Next.js

3. **CORS** : Le backend doit autoriser `http://localhost:3000`

4. **Ports** :
   - Frontend : 3000
   - Backend Géolocalisation : 8080
   - Backend Principal : 4004
