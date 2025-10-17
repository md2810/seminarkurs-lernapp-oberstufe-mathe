# 🚀 Firestore Deployment

## ⚠️ Problem
Die App zeigt "Missing or insufficient permissions" Fehler, weil die Firestore Sicherheitsregeln noch nicht deployed wurden.

## ✅ Lösung

### 1. Firebase CLI installieren (falls noch nicht installiert)
```bash
npm install -g firebase-tools
```

### 2. Bei Firebase anmelden
```bash
firebase login
```

### 3. Firebase Projekt initialisieren
```bash
firebase init
```

**Wähle aus:**
- ✅ Firestore (Rules and indexes)
- Verwende die existierenden Dateien:
  - `firestore.rules`
  - `firestore.indexes.json`

**Oder falls schon initialisiert, überspringe zu Schritt 4**

### 4. Firestore Regeln und Indexes deployen
```bash
firebase deploy --only firestore
```

Das deployt:
- Die Sicherheitsregeln aus `firestore.rules`
- Die Composite Indexes aus `firestore.indexes.json`

### 5. Warten auf Index-Erstellung
Nach dem Deploy kann es **2-5 Minuten** dauern, bis die Indexes fertig erstellt sind.
Du kannst den Status in der Firebase Console überprüfen:
1. Gehe zu [Firebase Console](https://console.firebase.google.com)
2. Wähle dein Projekt
3. Firestore Database → Indexes
4. Warte bis Status = "Enabled" (grün)

### 6. App neu laden
Sobald die Indexes fertig sind, lade die App neu und versuche erneut "Starten" zu klicken.

## 🔒 Was die Regeln erlauben
- ✅ Benutzer können ihre eigenen Daten lesen und schreiben (`users/{userId}`)
- ✅ Benutzer können ihre eigenen Subcollections verwenden:
  - `generatedQuestions` - Generierte Fragen
  - `questionProgress` - Fortschritt pro Frage
  - `autoModeAssessments` - AUTO-Modus Bewertungen
  - `learningSessions` - Lern-Sessions
- ❌ Benutzer können NICHT die Daten anderer Benutzer sehen

## 🔧 Troubleshooting

### "No project active"
```bash
firebase use --add
```
Wähle dein Firebase-Projekt aus der Liste.

### "Index already exists"
Das ist OK - bedeutet der Index wurde bereits erstellt.

### Weiterhin Permissions-Fehler
1. Überprüfe in Firebase Console → Firestore Database → Rules ob die neuen Regeln aktiv sind
2. Überprüfe ob du angemeldet bist (schaue in der App oben rechts)
3. Lösche den Browser-Cache und lade neu

---

*Letzte Aktualisierung: 2025-10-17*
