# 🔥 Firestore Setup & Konfiguration

## 🎯 Überblick

Diese App nutzt Firebase Firestore als Cloud-Datenbank für:
- **User Stats** (Level, XP, Streak)
- **Settings** (Theme, AI-Einstellungen, Klassenstufe)
- **Learning Plan** (Fortschritt in Topics)
- **Task History** (Alle gelösten/versuchten Aufgaben)
- **AI Memories** (Kontext für personalisierte KI-Antworten)

## 📊 Datenstruktur

```
users/{userId}/
  ├─ profile: {
  │    displayName: string
  │    email: string
  │    createdAt: timestamp
  │    lastLogin: timestamp
  │  }
  ├─ stats: {
  │    level: number
  │    xp: number
  │    xpToNextLevel: number
  │    streak: number
  │    totalXp: number
  │    lastActiveDate: string (ISO date)
  │  }
  ├─ settings: {
  │    theme: {name: string, primary: string}
  │    aiModel: {detailLevel, temperature, helpfulness, autoMode}
  │    gradeLevel: string
  │    courseType: string
  │  }
  ├─ learningPlan: {
  │    topics: [
  │      {id, title, progress, completed, total, lastAccessed}
  │    ]
  │  }
  ├─ memories: [
  │    {timestamp, content, context, importance, tags}
  │  ]
  └─ taskHistory: [
       {taskId, topicId, difficulty, correct, timeSpent, hintsUsed, timestamp}
     ]
```

## 🔐 Firestore Security Rules

### Schritt 1: Firebase Console öffnen
1. Gehe zu [Firebase Console](https://console.firebase.google.com/)
2. Wähle dein Projekt: `seminarkurs-lernapp`
3. Navigiere zu **Firestore Database** → **Regeln**

### Schritt 2: Security Rules einfügen

Kopiere folgende Rules in den Editor:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isValidEmail() {
      return request.auth.token.email.matches('.*@mvl-gym.de$');
    }

    function isEmailVerified() {
      return request.auth.token.email_verified == true;
    }

    // Users collection
    match /users/{userId} {
      // Only allow access if:
      // 1. User is signed in
      // 2. User is accessing their own data
      // 3. Email is from @mvl-gym.de domain
      // 4. Email is verified
      allow read, write: if isSignedIn()
                         && isOwner(userId)
                         && isValidEmail()
                         && isEmailVerified();

      // Allow user creation on first login (email not yet verified)
      allow create: if isSignedIn()
                    && isOwner(userId)
                    && isValidEmail();
    }
  }
}
```

### Schritt 3: Regeln veröffentlichen

Klicke auf **Veröffentlichen**, um die Rules zu aktivieren.

## ✅ Testen der Setup

### 1. User-Daten werden automatisch initialisiert

Beim ersten Login wird automatisch ein User-Dokument erstellt mit Standard-Werten.

### 2. Real-time Sync

Alle Änderungen (XP, Level, Settings) werden in Echtzeit synchronisiert zwischen:
- Frontend State
- Firestore Database
- Anderen Geräten (wenn der User auf mehreren Geräten eingeloggt ist)

### 3. Offline-Support

Firestore bietet automatisch Offline-Support:
- Daten werden lokal gecacht
- Änderungen werden automatisch synchronisiert, wenn wieder online
- Konflikte werden automatisch aufgelöst

## 🧠 AI Memories System

### Verwendung für personalisierte KI-Antworten

Das Memory-System speichert wichtige Interaktionen mit dem Nutzer:

```javascript
import { addMemory, getMemories } from './firebase/firestore'

// Memory hinzufügen
await addMemory(userId, {
  content: "User hat Schwierigkeiten mit Extremwertaufgaben",
  context: "Analysis - Extremwertprobleme - AFB III",
  importance: 8, // 1-10 Skala
  tags: ["analysis", "extremwerte", "schwierigkeit"]
})

// Memories abrufen für KI-Kontext
const relevantMemories = await getMemories(userId, {
  tags: ["analysis"],
  importance: 5,
  limit: 10
})

// Memories als Kontext für KI-Prompt verwenden
const context = relevantMemories
  .map(m => `- ${m.content} (${m.context})`)
  .join('\n')

const aiPrompt = `
Kontext über den Nutzer:
${context}

Aktuelle Aufgabe: ...
`
```

### Memory-Typen (Beispiele)

1. **Schwierigkeiten**: `"Braucht mehr Hinweise bei Vektorrechnung"`
2. **Stärken**: `"Sehr gut bei Ableitungen, löst schnell"`
3. **Präferenzen**: `"Bevorzugt grafische Erklärungen"`
4. **Lernstil**: `"Lernt am besten durch konkrete Beispiele"`
5. **Fortschritt**: `"Hat gerade Kurvendiskussion gemeistert"`

### Importance-Levels

- **1-3**: Niedrig (kleine Beobachtungen)
- **4-6**: Mittel (wiederkehrende Muster)
- **7-8**: Hoch (wichtige Präferenzen/Schwierigkeiten)
- **9-10**: Sehr hoch (kritische Informationen für Personalisierung)

## 📈 Task History Analytics

Die Task History ermöglicht später:
- Fortschritts-Tracking über Zeit
- Identifikation von Schwächen
- Adaptive Schwierigkeitsanpassung
- Performance-Statistiken

### Beispiel-Query für Analytics

```javascript
import { getTaskHistory } from './firebase/firestore'

// Alle Analysis-Aufgaben der letzten 30 Tage
const tasks = await getTaskHistory(userId, {
  topicId: 1, // Analysis
  limit: 50
})

// Erfolgsrate berechnen
const successRate = tasks.filter(t => t.correct).length / tasks.length
console.log(`Erfolgsrate Analysis: ${(successRate * 100).toFixed(1)}%`)

// Durchschnittliche Hinweise pro Aufgabe
const avgHints = tasks.reduce((sum, t) => sum + t.hintsUsed, 0) / tasks.length
console.log(`Ø Hinweise: ${avgHints.toFixed(1)}`)
```

## 🚀 Deployment

### Firebase CLI Setup

```bash
# Firebase CLI installieren
npm install -g firebase-tools

# Login
firebase login

# Projekt initialisieren
firebase init firestore

# Firestore Rules deployen
firebase deploy --only firestore:rules
```

## 🔄 Daten-Migration von localStorage

Falls User bereits Daten in localStorage haben, werden diese beim ersten Login automatisch übernommen und zu Firestore migriert.

Der Fallback auf localStorage bleibt aktiv, falls Firestore-Operationen fehlschlagen.

## 📝 Wichtige Hinweise

1. **Kosten**: Firestore Free Tier bietet:
   - 50k Reads/Tag
   - 20k Writes/Tag
   - 1 GB Storage

   Für eine Schul-App sollte das ausreichend sein!

2. **Indexe**: Für komplexe Queries müssen ggf. Composite Indexes angelegt werden.
   Firebase zeigt automatisch einen Link zum Anlegen, wenn ein Index fehlt.

3. **Backup**: Firebase bietet automatische Backups im Blaze-Plan.
   Alternativ: Scheduled Cloud Function für manuelle Backups.

## 🛠️ Entwicklung & Debugging

### Firestore Emulator (lokal)

```bash
# Emulator starten
firebase emulators:start

# App auf Emulator zeigen (in firebase/config.js)
import { connectFirestoreEmulator } from 'firebase/firestore'
if (location.hostname === 'localhost') {
  connectFirestoreEmulator(db, 'localhost', 8080)
}
```

### Chrome DevTools

Installiere die [Firebase Extension für Chrome](https://chrome.google.com/webstore/detail/firebase-devtools/oehlhebglafcghjfkjpmhlpjhckmfmgb) für besseres Debugging.

---

## ✅ Ergebnis

Die App ist jetzt mit Firestore verbunden und speichert alle User-Daten sicher in der Cloud.

---

*Letzte Aktualisierung: 2025-10-17*
