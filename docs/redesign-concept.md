# Redesign Concept: "The Adaptive Flow" (Final Vision)

## 1. Executive Summary

Die App wird komplett neu gebaut. Weg vom statischen "Lernplan-Dashboard", hin zu einer **radikalen, gestengesteuerten Lern-Experience**.
Wir kombinieren einen **TikTok-artigen Feed (Discovery)** mit einem **Spatial Canvas (Deep Work)**.

**Kern-Philosophie:**

1.  **Context is King:** Kein manuelles Abhaken von Listen. Der "Kontext" (Klausurdatum, Themenliste per Foto-Upload) steuert den Algorithmus im Hintergrund.
2.  **No Loading:** Der Feed muss sich anfühlen wie ein endloser Fluss. Inhalte werden "pre-fetched".
3.  **Failure is a Feature:** Wenn der User scheitert, wechselt das UI in den "Intervention Mode" (Split Screen Scaffolding).

---

## 2. UI Structure: "The Command Layer"

Wir verzichten auf eine permanente Sidebar. Die App ist immersiv (Fullscreen).

### 2.1 The "Command Center" (Navigation)

- **Trigger:** Ein minimalistischer Button oben rechts (oder Geste: Pinch out).
- **Behavior:** Der aktive Screen (Feed oder Canvas) zoomt zurück (scale down 0.9, blur), und darunter kommt das "System Interface" zum Vorschein.
- **Inhalt im Command Center:**
  - **Context-Engine:** Hier lädt man seine Themenliste hoch / chattet mit der AI.
  - **Settings:** API-Provider Wahl (Debug-Option), Account, Dark Mode.
  - **Stats:** XP, Streak.

### 2.2 The Dual View (Active Mode)

Der User ist immer in einem von zwei Zuständen:

- **A. The Feed (Standard):** Eine vertikale Liste von _Fragen_ (nicht Themen!). Fullscreen Cards.
- **B. The Canvas (Focus):** Ein Infinite Whiteboard für komplexe Zusammenhänge.
- **Desktop Layout:** "Dynamic Focus". Klick auf Feed -> Feed nimmt 70% Platz. Klick auf Canvas -> Canvas nimmt 70% Platz.

---

## 3. Core Features & Logic

### 3.1 The "Context" Engine (Input)

Ersetzt den alten "Lernplan".

- **Flow:** User öffnet Command Center -> "Neuer Kontext".
- **Input:** User lädt ein Foto hoch (z.B. Themenliste vom Lehrer).
- **Processing:**
  1.  Vision API extrahiert Themen.
  2.  Chat-Interface öffnet sich: "Habe Vektoren & Analysis erkannt. Wann ist die Klausur?"
  3.  Output: Ein JSON-Objekt, das den Feed-Algorithmus füttert.

### 3.2 The Infinite Feed (Algorithm)

- **Content:** Keine statischen Lektionen. Der Feed besteht aus _Cards_:
  - _Micro-Question:_ Multiple Choice / Kurze Eingabe.
  - _Mini-Explainer:_ 30s Video oder Animation (GeoGebra).
- **Buffering:** Es müssen immer 3-5 Karten im Voraus generiert sein. Kein Spinner beim Wischen!
- **API-Logic:** Der Feed ruft die AI (Claude/Gemini/OpenAI) live an, um basierend auf dem Context Fragen zu generieren.

### 3.3 Scaffolding (The Failure Loop)

Wenn der User eine Frage im Feed **falsch** beantwortet:

- **Kein** einfaches "Weiter".
- **Interaction:** Der Screen teilt sich (Split View).
  - _Oben:_ Die ungelöste, schwere Frage (ausgegraut).
  - _Unten:_ Ein neuer "Helper-Bot" oder eine vereinfachte Basis-Frage erscheint.
- **Goal:** Der User muss das Scaffolding unten lösen, um oben nochmal antworten zu dürfen.

---

## 4. Technical Architecture

### 4.1 Tech Stack

- **Framework:** React + Vite.
- **State:** `zustand` (Globaler Store für Feed-Queue, User-Settings, Context).
- **Animation:** `framer-motion` (Essenziell für die Swipes und den Command-Center Zoom).
- **Styling:** Tailwind CSS + `clsx`.
- **Canvas:** `@xyflow/react` (ehemals React Flow).

### 4.2 AI Provider Layer

In den Settings (Command Center) gibt es eine "Developer / Debug" Section.

- **Selector:** Dropdown [Anthropic Claude | Google Gemini | OpenAI GPT-4].
- **Key Input:** Feld für API Key (gespeichert in localStorage).
- Standardmäßig wird eine Proxy-Lösung oder ein Default-Key verwendet, aber Power-User können hier wechseln.

---

## 5. Implementation Roadmap for Claude Code

1.  **Scaffold Shell:** `Layout.jsx` mit Framer Motion bauen. Implementiere den "Command Center" Zoom-Effekt.
2.  **Context Store:** Baue den Zustand-Store, der "Context" (Themen, Deadline) hält.
3.  **Feed UI:** Baue die swipe-bare Card-Komponente und den Dummy-Buffer (Mock-Daten zuerst).
4.  **Split-Screen Logic:** Implementiere den State-Wechsel bei falscher Antwort.
