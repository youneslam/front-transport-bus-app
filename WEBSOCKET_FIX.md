# 🐛 Correction WebSocket - Service de Géolocalisation

## ✅ Problème Résolu

**Erreur** : `__TURBOPACK__imported__module__... is not a function`

**Cause** : Import statique de `sockjs-client` incompatible avec Next.js/Turbopack

**Solution** : Utilisation d'un import dynamique asynchrone

---

## 📝 Changements Effectués

### Fichier: `services/bus/socket.ts`

**Avant** (import statique - ❌ Ne fonctionne pas):
```typescript
import SockJS from "sockjs-client"

private initializeClient() {
  this.client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
  })
}
```

**Après** (import dynamique - ✅ Fonctionne):
```typescript
private async initializeClient() {
  // Import dynamique côté client uniquement
  const SockJS = (await import("sockjs-client")).default
  
  this.client = new Client({
    webSocketFactory: () => new SockJS(WS_URL) as any,
  })
}

async connect() {
  await this.initializeClient()
  this.client?.activate()
}
```

---

## 🚀 Test de la Correction

### 1. Redémarrer le serveur dev

```bash
# Arrêtez le serveur actuel (Ctrl+C)
# Puis relancez
npm run dev
```

### 2. Ouvrir la console navigateur

Allez sur votre application et ouvrez la **console développeur** (F12).

Vous devriez voir :
```
WebSocket connecté ✅
```

### 3. Tester la connexion WebSocket

Dans votre composant React :

```typescript
"use client"

import { useEffect, useState } from "react"
import { busSocketService } from "@/services/bus"

export function WebSocketTest() {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    // Vérifier la connexion
    const checkInterval = setInterval(() => {
      setConnected(busSocketService.isConnected())
    }, 1000)

    // Écouter les messages
    const unsubscribe = busSocketService.addListener((payload) => {
      console.log("Message reçu:", payload)
      setMessages(prev => [...prev, payload])
    })

    return () => {
      clearInterval(checkInterval)
      unsubscribe()
    }
  }, [])

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Test WebSocket</h2>
      <p>Status: {connected ? "✅ Connecté" : "❌ Déconnecté"}</p>
      <div className="mt-4">
        <h3 className="font-semibold">Messages reçus:</h3>
        <pre className="bg-gray-100 p-2 rounded mt-2">
          {JSON.stringify(messages, null, 2)}
        </pre>
      </div>
    </div>
  )
}
```

### 4. Envoyer un message test

Depuis un autre terminal ou Postman:

```bash
curl -X POST http://localhost:8080/api/location/update \
  -H "Content-Type: application/json" \
  -d '{
    "busId": 1,
    "latitude": 36.8065,
    "longitude": 10.1815,
    "timestamp": 1700000000000
  }'
```

**Résultat attendu** : Le message doit apparaître dans la console et dans votre composant.

---

## 🔍 Dépannage

### Erreur persiste après redémarrage

1. **Vider le cache Next.js** :
```bash
rm -rf .next
npm run dev
```

2. **Vérifier que sockjs-client est installé** :
```bash
npm list sockjs-client
```

### WebSocket ne se connecte toujours pas

1. **Vérifier que le backend tourne** :
```bash
curl http://localhost:8080/api/buses
```

2. **Vérifier l'URL WebSocket** :
   - Ouvrez `.env.local`
   - Vérifiez : `NEXT_PUBLIC_WS_URL=http://localhost:8080/ws`

3. **Vérifier la console pour les erreurs** :
   - Ouvrir F12 → Console
   - Chercher les erreurs de connexion WebSocket

### CORS Error

Si vous voyez une erreur CORS, ajoutez dans votre backend Spring Boot:

```java
@Configuration
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // ✅ Important
                .withSockJS();
    }
}
```

---

## ✨ Utilisation dans vos Composants

### Exemple Simple

```typescript
"use client"

import { useEffect } from "react"
import { busSocketService } from "@/services/bus"

export function MyComponent() {
  useEffect(() => {
    const unsubscribe = busSocketService.addListener((payload) => {
      console.log(`Bus ${payload.busId}:`, payload.latitude, payload.longitude)
      // Mettre à jour votre état, carte, etc.
    })

    return unsubscribe // Important pour le cleanup
  }, [])

  return <div>Tracking en temps réel...</div>
}
```

### Avec État React

```typescript
"use client"

import { useEffect, useState } from "react"
import { busSocketService } from "@/services/bus"
import type { BusLocationPayload } from "@/services/bus"

export function BusMap() {
  const [positions, setPositions] = useState<Map<number, BusLocationPayload>>(
    new Map()
  )

  useEffect(() => {
    const unsubscribe = busSocketService.addListener((payload) => {
      setPositions(prev => new Map(prev).set(payload.busId, payload))
    })

    return unsubscribe
  }, [])

  return (
    <div>
      {Array.from(positions.entries()).map(([busId, pos]) => (
        <div key={busId}>
          Bus {busId}: {pos.latitude}, {pos.longitude}
        </div>
      ))}
    </div>
  )
}
```

---

## 📚 Rappels Importants

1. **Import dynamique** : Nécessaire pour `sockjs-client` avec Next.js
2. **Cleanup** : Toujours retourner la fonction `unsubscribe` dans `useEffect`
3. **Vérification côté serveur** : `if (typeof window === "undefined")` évite les erreurs SSR
4. **Backend requis** : Le backend Spring Boot doit être démarré sur port 8080

---

## 🎯 Checklist de Vérification

- [ ] Backend Spring Boot lancé sur port 8080
- [ ] `sockjs-client` installé (`npm list sockjs-client`)
- [ ] `.env.local` contient `NEXT_PUBLIC_WS_URL=http://localhost:8080/ws`
- [ ] Serveur dev redémarré après les changements
- [ ] Console navigateur affiche "WebSocket connecté ✅"
- [ ] Aucune erreur dans la console
- [ ] Test d'envoi de message fonctionne

---

Tout devrait maintenant fonctionner correctement ! 🎉
