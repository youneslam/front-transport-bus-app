# Test WebSocket - Guide Rapide

## 🚀 Accès à la Page de Test

1. Démarrez votre serveur dev (si ce n'est pas déjà fait):
```bash
npm run dev
```

2. Ouvrez votre navigateur à:
```
http://localhost:3000/websocket-test
```

---

## 📋 Checklist Avant de Tester

### Backend Spring Boot

```bash
# Vérifier que le backend tourne
curl http://localhost:8080/api/buses
```

✅ **Si ça fonctionne** : Backend OK  
❌ **Si erreur** : Démarrez le backend Spring Boot

### Base de Données

- ✅ PostgreSQL doit être accessible
- ✅ Redis doit être accessible
- ✅ Au moins un bus doit exister

**Créer un bus de test** :
```bash
curl -X POST http://localhost:8080/api/buses \
  -H "Content-Type: application/json" \
  -d '{
    "matricule": "TUN-001",
    "description": "Bus Test",
    "trajetId": 1
  }'
```

---

## 🧪 Étapes de Test

### 1. Vérifier la Connexion WebSocket

Sur la page `/websocket-test` :
- Le badge en haut doit être **vert** avec "Connecté"
- La console navigateur (F12) doit afficher : `✅ WebSocket connecté`

**Si déconnecté** :
- Vérifiez que le backend tourne sur port 8080
- Vérifiez `.env.local` : `NEXT_PUBLIC_WS_URL=http://localhost:8080/ws`
- Regardez les erreurs dans la console

### 2. Envoyer une Position Test

1. Remplissez le formulaire :
   - Bus ID: `1`
   - Latitude: `36.8065`
   - Longitude: `10.1815`

2. Cliquez sur **"Envoyer Position"**

3. **Résultat attendu** :
   - Message de succès vert : "Position envoyée pour Bus 1"
   - Un nouveau message apparaît dans "Messages WebSocket Reçus"
   - La console affiche : `📨 Message WebSocket reçu`

### 3. Test Depuis le Terminal

Ouvrez un autre terminal et exécutez :

```bash
curl -X POST http://localhost:8080/api/location/update \
  -H "Content-Type: application/json" \
  -d '{
    "busId": 1,
    "latitude": 36.8100,
    "longitude": 10.1900,
    "timestamp": 1700000000000
  }'
```

**Résultat attendu** : Le message doit apparaître sur la page web en temps réel !

---

## 🐛 Problèmes Courants

### Badge reste "Déconnecté" 🔴

**Causes possibles** :
1. Backend non démarré
2. Port 8080 occupé
3. Erreur CORS
4. URL WebSocket incorrecte

**Solutions** :
```bash
# 1. Vérifier le backend
curl http://localhost:8080/api/buses

# 2. Vérifier les ports
netstat -ano | findstr :8080

# 3. Vérifier .env.local
cat .env.local | grep WS_URL
```

### Messages ne s'affichent pas 📭

**Vérifications** :
1. Ouvrez F12 → Console
2. Cherchez des erreurs
3. Vérifiez que le bus existe : `curl http://localhost:8080/api/buses/1`

### Erreur 404 sur /api/location/update

**Vérification backend** :
```bash
# Tester directement le backend
curl -X POST http://localhost:8080/api/location/update \
  -H "Content-Type: application/json" \
  -d '{"busId":1,"latitude":36.8065,"longitude":10.1815,"timestamp":1700000000000}'
```

Si ça ne fonctionne pas, vérifiez le `BusLocationController` du backend.

### Erreur "Bus not found"

```bash
# Lister les bus existants
curl http://localhost:8080/api/buses

# Si vide, créez un bus
curl -X POST http://localhost:8080/api/buses \
  -H "Content-Type: application/json" \
  -d '{"matricule":"TUN-001","description":"Test","trajetId":1}'
```

---

## 📊 Console du Navigateur

Ouvrez la console (F12) pour voir les logs en temps réel :

```
🔌 Tentative de connexion WebSocket...
✅ WebSocket connecté
📤 Envoi position: {busId: 1, latitude: 36.8065, longitude: 10.1815}
✅ Position envoyée avec succès
📨 Message WebSocket reçu: {busId: 1, latitude: 36.8065, ...}
```

---

## ✅ Test Réussi = Quoi Maintenant ?

Si tout fonctionne :
1. ✅ WebSocket connecté
2. ✅ Messages envoyés et reçus
3. ✅ Pas d'erreurs dans la console

**Vous pouvez maintenant** :
- Intégrer le tracking dans votre application
- Utiliser `busSocketService` dans vos composants
- Afficher les positions sur une carte (Leaflet, Google Maps...)

---

## 🗺️ Prochaine Étape : Intégration Carte

Exemple avec Leaflet :

```typescript
"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import { busSocketService } from "@/services/bus"
import type { BusLocationPayload } from "@/services/bus"

export function BusMap() {
  const [positions, setPositions] = useState<Map<number, BusLocationPayload>>(new Map())

  useEffect(() => {
    const unsubscribe = busSocketService.addListener((payload) => {
      setPositions(prev => new Map(prev).set(payload.busId, payload))
    })
    return unsubscribe
  }, [])

  return (
    <MapContainer center={[36.8065, 10.1815]} zoom={13} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {Array.from(positions.values()).map(pos => (
        <Marker key={pos.busId} position={[pos.latitude, pos.longitude]}>
          <Popup>Bus {pos.busId}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

---

Bon test ! 🚀
