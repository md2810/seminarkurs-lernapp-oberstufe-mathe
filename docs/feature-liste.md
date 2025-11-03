# 📋 Feature-Liste - MatheLernApp Oberstufe

## 🎯 Übersicht
Eine interaktive Mathematik-Lernapp für die Oberstufe (K1) mit KI-gestützter Fragengeneration, Gamification und Cloud-Synchronisation.

**Entwickelt von:** Marco Duzevic, Joel Dürr, Emmi Lang, Luisa Schulze, Hatice Erdogan

---

## 1. Authentifizierung & Benutzerverwaltung

### 1.1 Firebase Authentication
- **Registrierung** mit Email und Passwort
- **Login** mit Email und Passwort
- **Email-Verifizierung** (erforderlich vor App-Nutzung)
- **Passwort-Reset** via Email
- **Automatische Session-Verwaltung**
- **Abmelde-Funktion**

### 1.2 Account-Einstellungen
- Benutzerprofil-Verwaltung
- Email-Anzeige
- Passwort ändern
- Account-Details bearbeiten

**Git-Referenz:**
- `f072b60` - Firebase authentication
- `7913a21` - Account settings and password reset functionality

---

## 2. Cloud-Datenspeicherung (Firebase Firestore)

### 2.1 Benutzerdaten-Synchronisation
- **Echtzeit-Synchronisation** aller Benutzerdaten
- **Automatische Initialisierung** des Benutzerprofils beim ersten Login
- **Persistente Speicherung** von:
  - Benutzerstatistiken (XP, Level, Streak)
  - Einstellungen (Theme, Klassenstufe, Kursart)
  - Lernfortschritt pro Thema
  - Aufgaben-Historie
  - Lernplan

### 2.2 Offline-Fallback
- LocalStorage als Fallback bei Verbindungsproblemen
- Automatisches Backup wichtiger Daten

**Git-Referenz:** `668db68` - Firebase Firestore integration

---

## 3. KI-gestützte Funktionen (Claude AI)

### 3.1 Intelligente Fragengeneration
- **Kontextbewusste Generierung** basierend auf:
  - Benutzer-Performance
  - Vergangenen Aufgaben
  - Klassenstufe und Kursart (Leistungsfach/Basisfach)
  - Ausgewählten Themen
- **Adaptive Schwierigkeitsanpassung**
- **Personalisierte Hinweise** (3-Stufen-System)

### 3.2 AUTO-Modus
- Automatische Bewertung des Leistungsstands
- Anpassung der Fragenschwierigkeit basierend auf Performance
- Speicherung von Bewertungen für kontinuierliche Verbesserung

### 3.3 Bild-Analyse (KI-gestützt)
- **Hochladen von Themenlisten** (Fotos/Screenshots)
- **Automatische Texterkennung** und Themenextraktion
- **Intelligente Zuordnung** zu Lehrplan-Themen
- Automatische Auswahl erkannter Themen

### 3.4 Memory-System
- Speicherung wichtiger Lernkontext-Informationen
- Verwendung bei Fragengeneration für bessere Personalisierung
- Fragenkatalog aus Altklausuren

**Git-Referenz:** `dc847c2` - AI features powered by claude

**Technologie:** Anthropic Claude API

---

## 4. Gamification-System

### 4.1 Erfahrungspunkte (XP)
- **XP-Vergabe** für richtig gelöste Aufgaben
- **XP-Berechnung** basierend auf Schwierigkeit
- **Gesamt-XP-Tracking**
- **XP-Fortschrittsbalken** zum nächsten Level

### 4.2 Level-System
- Automatischer Level-Aufstieg bei Erreichen der XP-Schwelle
- Progressive XP-Anforderungen (1.5x pro Level)
- **Visuelle XP-Progression-Path** mit Meilensteinen
- Level-Anzeige im Dashboard

### 4.3 Streak-System
- **Tägliche Streak-Tracking**
- Automatisches Update bei App-Nutzung
- Streak-Visualisierung mit Feuer-Icon
- Motivationsfaktor für regelmäßiges Lernen
- Nach 3, 5, 10, usw. Tagen extra Belohnung
- Abzeichen
- Freundschaftssystem 

### 4.4 Visuelle Belohnungen
- **Partikel-Explosion** bei korrekten Antworten
- **Animierte Feedback-Messages**
- **Erfolgs-Popups** mit XP-Anzeige

### 4.5 Freundschaftssystem
- gemeinsame Streak (extra Abzeichen) 
**Git-Referenz:**
- `cc65b6d` - XP progression path
- `5db3ccc` - Dashboard stats

---

## 5. Lernplan-System

### 5.1 Strukturiertes Lernen
- **Themenauswahl** aus Baden-Württemberg Oberstufen-Curriculum
- **Hierarchische Organisation**: Leitidee → Thema → Unterthema
- **Mehrere Lernziele** parallel verwaltbar
- **Prüfungsdatum-Tracking** mit Countdown
- **Fortschrittsverfolgung** pro Lernziel

### 5.2 Curriculum-Integration
- Vollständiger BW-Lehrplan für Klasse 11/12
- Unterscheidung Leistungsfach/Basisfach
- Leitideen:
  - Analysis
  - Analytische Geometrie
  - Stochastik

### 5.3 Flexible Themenwahl
- Manuelle Themenauswahl mit Checkboxen
- Upload von Themenlisten (KI-gestützt)
- Zusammenklappbare Themenbaum-Struktur
- Anzeige der Auswahlzähler

### 5.4 Lernziel-Verwaltung
- Titel und Datum für jedes Lernziel
- Checkbox zum Abhaken erledigter Ziele
- Löschen von Lernzielen
- LocalStorage-Persistierung

**Git-Referenz:**
- `954667a` - Comprehensive learning plan system
- `c47352c` - Grade-level settings and fullscreen learning plan

---

## 6. Fragen- und Übungssystem

### 6.1 Fragengeneration
- **API-basierte Generierung** über Backend
- **Fortschrittsanzeige** während Generierung (0-100%)
- **Session-basiertes System** für Fragensätze
- **Themenspezifische Fragen** basierend auf Lernplan

### 6.2 Fragenanzeige (QuestionSession)
- Interaktive Fragenoberfläche
- LaTeX-Unterstützung für mathematische Formeln
- Eingabefeld für Antworten
- Hinweis-System (3 Stufen)
- Überspringen-Funktion

### 6.3 Antwort-Feedback
- **Sofortiges Feedback** (Richtig/Falsch)
- **Lösungsanzeige** nach Beantwortung
- **XP-Vergabe** bei korrekten Antworten
- **Performance-Tracking**

### 6.4 Topic-Cards im Dashboard
- **Fortschrittsbalken** pro Thema
- **Genauigkeits-Anzeige** (Ø %)
- **Anzahl gelöster Aufgaben**
- **Schnellzugriff** auf offene Sessions
- **"Weitere Fragen generieren"** Button

**Git-Referenz:**
- Implementiert über `App.jsx` und `QuestionSession.jsx`

---

## 7. Einstellungen & Personalisierung

### 7.1 Theme-Anpassung
- **Farbschema-Auswahl** (z.B. Orange)
- **Dynamische CSS-Variable-Anpassung**
- **Echtzeit-Vorschau**
- Speicherung in Firestore

### 7.2 KI-Einstellungen
- **Detail-Level** (0-100)
- **Temperatur** (Kreativität der KI)
- **Helpfulness** (Hilfsbereitschaft)
- **AUTO-Modus** Toggle

### 7.3 Kurs-Einstellungen
- **Klassenstufe**: Klasse 11 oder Klasse 12
- **Kursart**: Leistungsfach oder Basisfach
- Beeinflusst verfügbare Themen und Schwierigkeit

### 7.4 API-Key-Verwaltung
- Eingabefeld für Anthropic API-Key
- Sichere Speicherung in Firestore/LocalStorage
- Erforderlich für KI-Features

**Git-Referenz:**
- `c47352c` - Grade-level settings, AUTO mode toggle
- `5db3ccc` - Dynamic theming
- `d447753` - Theme customization

---

## 8. Benutzeroberfläche & Design

### 8.1 Ultra-Smooth Animations
- **Framer Motion** für alle Animationen
- **Physics-based** Spring-Animationen
- **Parallax-Effekte** basierend auf Mausposition
- **3D-Transformationen** (rotateX, rotateY)
- **Smooth Scroll-Animationen**
- **Blur-Effekte** während Transitions

### 8.2 Responsive Design
- **Mobile-First** Ansatz
- **Touch-optimierte** Interaktionen
- **Adaptive Layouts** für verschiedene Bildschirmgrößen
- Optimierte Overflow-Behandlung

### 8.3 Minimalistisches Design
- Cleane, spacious Layouts
- Glassmorphism-Effekte
- Moderne Typografie
- Konsistente Farbverwendung
- Iconography (Phosphor Icons)

### 8.4 Interaktive Elemente
- **Hover-Effekte** mit Scale und Lift
- **Tap-Feedback** (Scale-Down)
- **Smooth Dropdown-Navigation**
- **Animierte Modals**
- **Collapsible Sections**

**Git-Referenz:**
- `f072b60` - Ultra-smooth physics animations
- `6383d26` - Ultra-realistic physics-based animations
- `81fb9d3` - ABSURDLY SMOOTH animations
- `c473fc7` - Professional minimalist redesign
- `2d2b1f8` - Glassmorphism design
- `67e6c09` - Mobile UX improvements

---

## 9. Dashboard & Statistiken

### 9.1 Stats-Dashboard
- **3-Karten-Layout** (Top Row):
  - Streak (Tage)
  - Level
  - Gesamt XP
- **XP-Progress-Card** (Bottom Row):
  - Aktuelle XP
  - XP bis nächstes Level
  - Visuelle Progression-Path mit 4 Meilensteinen

### 9.2 Topics Grid
- **Card-basierte** Themendarstellung
- **Fortschrittsbalken** pro Thema
- **Statistiken** (Genauigkeit, Anzahl Aufgaben)
- **Hover-Animationen** mit 3D-Effekten
- **Staggered Entry-Animationen**

### 9.3 Navigation
- **Dropdown-Menü** im Header
- Schnellzugriff auf:
  - Lernplan
  - Account-Einstellungen
  - App-Einstellungen
  - Abmelden

**Git-Referenz:** `5db3ccc` - Dashboard stats, collapsible learning plan

---

## 10. Mathematik-spezifische Features

### 10.1 LaTeX-Unterstützung
- **KaTeX** für Formeldarstellung
- Rendering mathematischer Notation
- Unterstützung für komplexe Formeln

### 10.2 Schwierigkeitsgrade
- AFB I (Reproduktion)
- AFB II (Zusammenhänge)
- AFB III (Problemlösung)

### 10.3 Curriculum-Abdeckung
- **Analysis**: Ableitungen, Integrale, Extremwertaufgaben, etc.
- **Analytische Geometrie**: Vektoren, Geraden, Ebenen, etc.
- **Stochastik**: Wahrscheinlichkeit, Kombinatorik, etc.

---

## 11. Performance & Optimierung

### 11.1 Animations-Optimierung
- Optimierte Stiffness/Damping-Werte
- Reduced Motion bei Bedarf
- GPU-beschleunigte Transformationen
- Smooth 60fps-Animationen

### 11.2 Daten-Management
- Effiziente Firestore-Queries
- Real-time Subscriptions nur für aktuelle Daten
- Cleanup von Subscriptions
- Lazy Loading von Themen

### 11.3 State Management
- React Hooks (useState, useEffect, useRef)
- Context API (AuthContext)
- Optimierte Re-Renders
- Controlled Components

**Git-Referenz:** `dbeaa5e` - Optimize animations

---

## 12. Technologie-Stack

### Frontend
- **React 18** - UI Framework
- **Vite** - Build Tool & Dev Server
- **Framer Motion 12** - Animation Library
- **Phosphor Icons** - Icon Set
- **KaTeX** - Math Rendering

### Backend & Services
- **Firebase Authentication** - User Management
- **Firebase Firestore** - Cloud Database
- **Cloudflare Pages** - Hosting
- **Cloudflare Workers** - Serverless API

### KI & ML
- **Anthropic Claude API** - AI-powered Features
- **Custom API Endpoints** für:
  - Fragengeneration (`/api/generate-questions`)
  - Bildanalyse (`/api/analyze-image`)

### Development
- **ESBuild** - Fast Bundling
- **wrangler** - Cloudflare CLI

---

## 13. Geplante Features & Roadmap

*(Basierend auf Code-Kommentaren und TODOs)*

### 13.1 Adaptives Lernsystem
- **Einführungstest nach Lernplan-Erstellung**
  - Feststellung der Kenntnisse zu jedem gewählten Thema
  - Basierend auf Selbsteinschätzung (ähnlich Duolingo bei neuer Sprache)
  - KI-gestützte Auswertung für personalisierte Lernerfahrung

- **Intelligenter "Lernen"-Button**
  - Keine manuelle Themenauswahl mehr erforderlich (wird optional)
  - KI wählt automatisch Themen, Anzahl und Schwierigkeitsgrad der Aufgaben
  - Basierend auf Nutzerverhalten und Einführungstest-Ergebnissen
  - Mehrere Themen gleichzeitig zum abwechslungsreichen Lernen

- **Progressive Aufgabenkomplexität**
  - Automatischer Übergang von Schritt-für-Schritt-Aufgaben zu komplett selbstständigen Aufgaben
  - KI-Modell entscheidet basierend auf Lernfortschritt
  - Adaptive Anpassung der Hilfestellungen

### 13.2 Multimediale Lerninhalte
- **Intelligente Erklärungen**
  - Multimediale Erklärungen zu Themen/Aufgaben
  - Automatische Erkennung durch KI, wenn Lernende Schwierigkeiten haben
  - KI-Generierung von Animationen (optional)
  - Automatisches Raussuchen relevanter YouTube-Videos mit Google Gemini
  - Verschiedene Erklärungsformate basierend auf Lerntyp

### 13.3 Weitere Features
- Erweiterte Statistiken und Analytics
- Mehr Theme-Optionen
- Export von Lernfortschritt
- Social Features (optional)
- Offline-Modus mit Sync
- Erweitertes Memory-System für KI
- Spaced Repetition Algorithm
- Lehrer-Dashboard (optional)

---

## 📌 Zusammenfassung

Die MatheLernApp bietet eine moderne, KI-gestützte Lernplattform speziell für Mathematik in der Oberstufe. Mit Gamification, adaptiver Fragengeneration, und ultra-smooth Animationen wird das Lernen zu einem angenehmen und effektiven Erlebnis.

**Kernstärken:**
- ✅ KI-gestützte, personalisierte Fragengeneration
- ✅ Vollständige BW-Curriculum-Integration
- ✅ Cloud-Synchronisation über alle Geräte
- ✅ Motivierendes Gamification-System
- ✅ Ultra-smooth, moderne Benutzeroberfläche
- ✅ Bildanalyse für schnelle Lernplan-Erstellung

---

*Erstellt am: 2025-10-15*
*Letzte Aktualisierung: 2025-10-17*
*Basierend auf Git-Commits bis: dc847c2*
