# KI-Integration Konzept

## 🎯 Überblick

Die App nutzt **Claude 4.5 Sonnet** über die Anthropic API für:
- 🖼️ **Bildanalyse** von Themenlisten
- ❓ **Fragengenerierung** basierend auf Bildungsplan
- 💡 **Adaptive Hinweise** (3 Stufen + individuelles Feedback)
- 🎓 **AUTO-Modus** für personalisierte Lernoptimierung
- ✅ **Antwortbewertung** mit detailliertem Feedback

---

## 📊 Datenstruktur (Firestore)

### 1. Generated Questions

```javascript
users/{userId}/generatedQuestions/{sessionId}/
  ├─ sessionId: string (UUID)
  ├─ createdAt: timestamp
  ├─ learningPlanItemId: string (Reference to learning plan item)
  ├─ topics: [
  │    {leitidee: string, thema: string, unterthema: string}
  │  ]
  ├─ userContext: {
  │    gradeLevel: string
  │    courseType: string
  │    autoModeAssessment: object | null
  │    recentPerformance: object | null
  │  }
  ├─ questions: [
  │    {
  │      id: string
  │      type: "multiple-choice" | "step-by-step"
  │      topic: string (reference to main topic)
  │      subtopic: string
  │      difficulty: 1-5
  │      question: string (LaTeX supported)
  │
  │      // Multiple Choice specific
  │      options?: [
  │        {id: "A", text: string, isCorrect: boolean}
  │      ]
  │
  │      // Step-by-Step specific
  │      steps?: [
  │        {
  │          stepNumber: 1,
  │          instruction: string,
  │          expectedAnswer: string,
  │          tolerance?: number (for numerical answers)
  │        }
  │      ]
  │
  │      // Hints (generated upfront)
  │      hints: [
  │        {level: 1, text: string},
  │        {level: 2, text: string},
  │        {level: 3, text: string}
  │      ]
  │
  │      // Solution
  │      solution: string
  │      explanation: string
  │
  │      // GeoGebra (optional)
  │      geogebra?: {
  │        appletId: string | null
  │        commands: string[] (GeoGebra commands for visualization)
  │      }
  │    }
  │  ]
```

### 2. Question Progress

```javascript
users/{userId}/questionProgress/{questionId}/
  ├─ questionId: string
  ├─ sessionId: string
  ├─ startedAt: timestamp
  ├─ completedAt: timestamp | null
  ├─ status: "in_progress" | "completed" | "skipped"
  ├─ hintsUsed: number (0-3)
  ├─ hintsUsedDetails: [
  │    {level: 1, usedAt: timestamp}
  │  ]
  ├─ customHintRequested: boolean
  ├─ customHintQuestion: string | null
  ├─ customHintResponse: string | null
  ├─ attempts: number
  ├─ isCorrect: boolean
  ├─ userAnswer: any (depends on question type)
  ├─ timeSpent: number (seconds)
  ├─ xpEarned: number
  └─ xpBreakdown: {
       base: number
       hintPenalty: number
       timePenalty: number
       bonuses: number
       total: number
     }
```

### 3. AUTO Mode Assessments

```javascript
users/{userId}/autoModeAssessments/{assessmentId}/
  ├─ assessmentId: string (UUID)
  ├─ timestamp: timestamp
  ├─ triggeredBy: "question_completion" | "session_end" | "manual"
  ├─ previousAssessment: {
  │    detailLevel: number (0-100)
  │    temperature: number (0-1)
  │    helpfulness: number (0-100)
  │    reasoning: string (previous 2-sentence assessment)
  │  } | null
  ├─ currentAssessment: {
  │    detailLevel: number (0-100)
  │    temperature: number (0-1)
  │    helpfulness: number (0-100)
  │    reasoning: string (new 2-sentence assessment - NOT shown to user)
  │  }
  ├─ performanceData: {
  │    last10Questions: [
  │      {correct: boolean, hintsUsed: number, timeSpent: number}
  │    ]
  │    avgAccuracy: number
  │    avgHintsUsed: number
  │    avgTimeSpent: number
  │    strugglingTopics: [string]
  │  }
```

### 4. Learning Sessions

```javascript
users/{userId}/learningSessions/{sessionId}/
  ├─ sessionId: string
  ├─ startedAt: timestamp
  ├─ endedAt: timestamp | null
  ├─ learningPlanItemId: string
  ├─ generatedQuestionsId: string
  ├─ questionsCompleted: number
  ├─ questionsTotal: number
  ├─ totalXpEarned: number
  ├─ avgAccuracy: number
  ├─ totalTimeSpent: number
```

---

## 🔌 API-Endpunkte (Cloudflare Functions)

### `/functions/api/analyze-image.js`

**Purpose**: Analysiert hochgeladenes Bild einer Themenliste und extrahiert Themen

**Request**:
```javascript
POST /api/analyze-image
{
  apiKey: string,
  image: string (base64),
  gradeLevel: string,
  courseType: string
}
```

**Response**:
```javascript
{
  success: boolean,
  extractedTopics: [
    {
      leitidee: string,
      thema: string,
      unterthema: string,
      confidence: number (0-1)
    }
  ],
  matchedFromCurriculum: boolean,
  suggestions: string[] (if topics don't match curriculum exactly)
}
```

**Claude Prompt**:
```
Du bist ein Experte für den Baden-Württemberg Bildungsplan Mathematik Oberstufe.

Der Nutzer hat ein Bild einer Themenliste hochgeladen (z.B. für eine Klausur).

DEINE AUFGABE:
1. Analysiere das Bild und extrahiere alle sichtbaren mathematischen Themen
2. Mappe die Themen auf den offiziellen BW-Bildungsplan
3. Gib die Themen im strukturierten Format zurück

KONTEXT:
- Klassenstufe: {gradeLevel}
- Kurstyp: {courseType}

BILDUNGSPLAN:
{curriculum_json}

Gib deine Antwort als JSON zurück:
{
  "extractedTopics": [
    {
      "leitidee": "3.4.1 Leitidee Zahl – Variable – Operation",
      "thema": "weitere Ableitungsregeln anwenden",
      "unterthema": "die Produkt- und Kettenregel zum Ableiten von Funktionen verwenden",
      "confidence": 0.95
    }
  ]
}
```

---

### `/functions/api/generate-questions.js`

**Purpose**: Generiert 20 Fragen pro Themenbereich mit Hints, Lösungen und GeoGebra-Commands

**Request**:
```javascript
POST /api/generate-questions
{
  apiKey: string,
  userId: string,
  learningPlanItemId: string,
  topics: [
    {leitidee: string, thema: string, unterthema: string}
  ],
  userContext: {
    gradeLevel: string,
    courseType: string,
    autoModeAssessment: object | null,
    recentMemories: string[] (from Firestore memories),
    recentPerformance: {
      avgAccuracy: number,
      strugglingTopics: string[]
    }
  }
}
```

**Response**:
```javascript
{
  success: boolean,
  sessionId: string,
  questions: [
    {
      id: string,
      type: "multiple-choice" | "step-by-step",
      topic: string,
      subtopic: string,
      difficulty: number,
      question: string,
      options?: [...],
      steps?: [...],
      hints: [
        {level: 1, text: string},
        {level: 2, text: string},
        {level: 3, text: string}
      ],
      solution: string,
      explanation: string,
      geogebra?: {
        appletId: string | null,
        commands: string[]
      }
    }
  ]
}
```

**Claude Prompt**:
```
Du bist ein erfahrener Mathematiklehrer für die Oberstufe in Baden-Württemberg.

AUFGABE:
Generiere 20 hochwertige Übungsaufgaben basierend auf folgenden Themen:

THEMEN:
{topics_json}

NUTZERKONTEXT:
- Klassenstufe: {gradeLevel}
- Kurstyp: {courseType}
- Bisherige Schwierigkeiten: {strugglingTopics}
- AUTO-Modus Einschätzung: {autoModeAssessment}

WICHTIGE ANFORDERUNGEN:

1. FRAGETYPEN (Mix):
   - 70% Multiple-Choice (4 Antwortoptionen, genau 1 korrekt)
   - 30% Step-by-Step (2-4 Schritte)

2. SCHWIERIGKEITSVERTEILUNG:
   - 20% Schwierigkeit 1-2 (AFB I)
   - 50% Schwierigkeit 3 (AFB II)
   - 30% Schwierigkeit 4-5 (AFB III)

3. HINWEISE:
   Für jede Frage generiere 3 Hinweisstufen:
   - Hint 1: Sanfter Denkanstoß (keine Lösung)
   - Hint 2: Konkreter Tipp zur Methode
   - Hint 3: Fast vollständiger Lösungsweg (aber Schüler muss selbst rechnen)

4. GEOGEBRA (wenn sinnvoll):
   - Bei Geometrie/Analysis: Gib GeoGebra-Befehle an
   - Beispiel: ["f(x) = x^2", "Tangent(2, f)"]

5. PERSONALISIERUNG:
   {autoModeAssessment_text}

Gib deine Antwort als JSON zurück:
{
  "questions": [...]
}
```

---

### `/functions/api/evaluate-answer.js`

**Purpose**: Bewertet Nutzerantwort und berechnet XP

**Request**:
```javascript
POST /api/evaluate-answer
{
  apiKey: string,
  userId: string,
  questionId: string,
  questionData: object,
  userAnswer: any,
  hintsUsed: number,
  timeSpent: number
}
```

**Response**:
```javascript
{
  success: boolean,
  isCorrect: boolean,
  feedback: string,
  correctAnswer: string | object,
  xpEarned: number,
  xpBreakdown: {
    base: number,
    hintPenalty: number,
    timePenalty: number,
    bonuses: number,
    total: number
  }
}
```

**XP-Berechnung**:
```javascript
// Basis-XP nach Schwierigkeit
const BASE_XP = {
  1: 10, 2: 15, 3: 20, 4: 30, 5: 50
}

let xp = BASE_XP[difficulty]

// Hint Penalty
const HINT_PENALTY = {
  0: 1.0,   // 100%
  1: 0.85,  // 85%
  2: 0.65,  // 65%
  3: 0.40   // 40%
}
xp *= HINT_PENALTY[hintsUsed]

// Zeit-Bonus (wenn sehr schnell)
if (timeSpent < expectedTime * 0.5) {
  xp *= 1.2  // +20% bonus
}

// Skip Penalty
if (skipped) {
  xp = 0
}

// Streak Bonus (5+ Aufgaben richtig hintereinander)
if (correctStreak >= 5) {
  xp *= 1.5  // +50% bonus
}

return Math.round(xp)
```

---

### `/functions/api/generate-custom-hint.js`

**Purpose**: Generiert individuellen Hint nach "Wo hängts?" Frage

**Request**:
```javascript
POST /api/generate-custom-hint
{
  apiKey: string,
  userId: string,
  questionData: object,
  userQuestion: string (from "Wo hängts?" text field),
  previousHints: string[],
  userContext: object
}
```

**Response**:
```javascript
{
  success: boolean,
  customHint: string
}
```

**Claude Prompt**:
```
Du bist ein geduldiger Mathe-Tutor.

Der Schüler hat alle 3 Standard-Hinweise verwendet und hat eine spezifische Frage:

AUFGABE:
{question}

BISHERIGE HINWEISE:
{hints_used}

SCHÜLER FRAGT:
"{userQuestion}"

Gib einen hilfreichen, aber nicht die Lösung verratenden Hinweis.
Sei geduldig und ermutigend.
```

---

### `/functions/api/update-auto-mode.js`

**Purpose**: Aktualisiert AUTO-Modus Assessment nach jeder Aufgabe

**Request**:
```javascript
POST /api/update-auto-mode
{
  apiKey: string,
  userId: string,
  previousAssessment: object | null,
  performanceData: {
    last10Questions: [...],
    avgAccuracy: number,
    avgHintsUsed: number,
    strugglingTopics: string[]
  }
}
```

**Response**:
```javascript
{
  success: boolean,
  newAssessment: {
    detailLevel: number,
    temperature: number,
    helpfulness: number,
    reasoning: string (2 sentences - NOT shown to user)
  }
}
```

**Claude Prompt**:
```
Du bist ein KI-Lernsystem, das die optimalen Lerneinstellungen für einen Schüler bestimmt.

VORHERIGE EINSCHÄTZUNG:
{previousAssessment}

AKTUELLE PERFORMANCE:
- Erfolgsrate (letzte 10 Aufgaben): {avgAccuracy}%
- Durchschnittliche Hinweise: {avgHintsUsed}
- Schwierige Themen: {strugglingTopics}

DEINE AUFGABE:
Passe die Lernparameter an, um dem Schüler optimal zu helfen:

1. detailLevel (0-100): Wie ausführlich sollen Erklärungen sein?
2. temperature (0-1): Wie kreativ vs. präzise sollen Hinweise sein?
3. helpfulness (0-100): Wie viel Unterstützung braucht der Schüler?

BEISPIEL-LOGIK:
- Hohe Erfolgsrate (>80%) → Weniger Hilfe, mehr Eigenständigkeit
- Niedrige Erfolgsrate (<50%) → Mehr Details, mehr Unterstützung
- Viele Hinweise genutzt → Erhöhe helpfulness
- Spezifische Probleme → Passe temperature an (präziser bei Problemen)

Gib deine Einschätzung als JSON zurück:
{
  "detailLevel": 65,
  "temperature": 0.5,
  "helpfulness": 70,
  "reasoning": "Schüler zeigt Fortschritt in Analysis, aber braucht noch Unterstützung bei komplexen Ableitungen. Detailgrad leicht erhöht, um Sicherheit zu stärken."
}

WICHTIG: Die reasoning-Begründung wird NICHT dem Nutzer angezeigt, nur intern gespeichert.
```

---

## 🎮 Frontend-Flow

### 1. Lernplan → Generierung

```
LearningPlan.jsx:
├─ Nutzer wählt Themen ODER uploaded Bild
├─ Bei Bild: Call /api/analyze-image
├─ Bestätigung: "Diese Themen wurden erkannt: ..."
├─ Button: "Fragen generieren"
├─ Call /api/generate-questions
├─ Loading-Animation (ca. 10-30 Sekunden)
└─ Weiterleitung zu QuestionSession.jsx
```

### 2. Question Session

```
QuestionSession.jsx:
├─ Zeigt Frage 1/20
├─ Bei Multiple-Choice: 4 Buttons
├─ Bei Step-by-Step: Input-Felder für jeden Schritt
├─ Hint-System:
│   ├─ Button "Hinweis 1" → Show hint, XP penalty
│   ├─ Button "Hinweis 2" → Show hint, XP penalty
│   ├─ Button "Hinweis 3" → Show hint, XP penalty
│   └─ Danach: Textfeld "Wo hängts?" → Call /api/generate-custom-hint
├─ Optional: GeoGebra-Embed (iframe oder WebView)
├─ "Überspringen" → 0 XP
├─ "Antworten" → Call /api/evaluate-answer
├─ Feedback-Modal:
│   ├─ ✅ Richtig! +XP mit Animation
│   ├─ ❌ Falsch. Erklärung...
│   └─ Fortschrittsbalken: 5/20 Fragen
└─ Bei AUTO-Modus: Call /api/update-auto-mode nach jeder Frage
```

### 3. Session Complete

```
SessionComplete.jsx:
├─ Zusammenfassung:
│   ├─ Fragen beantwortet: 18/20
│   ├─ Erfolgsrate: 85%
│   ├─ Gesamt-XP: +345
│   └─ Neue Level-Ups / Badges
├─ TOP 3 Schwächen: "Du solltest noch üben: ..."
└─ Button: "Neue Session" oder "Zurück zum Dashboard"
```

---

## ⚙️ Settings-Erweiterung

### Neue Debugging-Sektion

```javascript
// Settings.jsx - Add new section

<section className="settings-section">
  <h3><Bug weight="bold" /> Debugging</h3>

  <div className="api-key-input">
    <label>Anthropic API Key</label>
    <input
      type="password"
      placeholder="sk-ant-..."
      value={localSettings.anthropicApiKey || ''}
      onChange={(e) => handleApiKeyChange(e.target.value)}
    />
    <p className="input-hint">
      Wird nur lokal gespeichert, nie an unsere Server gesendet
    </p>
  </div>

  <div className="debug-options">
    <label>
      <input
        type="checkbox"
        checked={localSettings.showAiAssessments || false}
        onChange={(e) => handleToggle('showAiAssessments', e.target.checked)}
      />
      AUTO-Modus Einschätzungen anzeigen (für Debugging)
    </label>

    <label>
      <input
        type="checkbox"
        checked={localSettings.logApiCalls || false}
        onChange={(e) => handleToggle('logApiCalls', e.target.checked)}
      />
      API-Calls in Console loggen
    </label>

    <button
      className="btn btn-secondary"
      onClick={handleClearCache}
    >
      Cache leeren
    </button>
  </div>
</section>
```

---

## 🚀 Implementierungs-Reihenfolge

1. ✅ **Firestore-Schema erweitern**
2. ✅ **Settings: API-Key Input**
3. ✅ **Cloudflare Functions: API-Endpunkte**
4. ✅ **LearningPlan: Bildupload + Analyse**
5. ✅ **Question Generation Flow**
6. ✅ **QuestionSession Component**
7. ✅ **Hints-System + "Wo hängts?"**
8. ✅ **XP-Berechnung + Animation**
9. ✅ **AUTO-Modus Assessment (nach jeder Frage)**
10. ✅ **GeoGebra-Integration (optional)**
11. ✅ **Testing + Refinement**

---

## 📝 Wichtige Notizen

### API-Key Security
- API-Key wird NUR in localStorage gespeichert
- Wird von Frontend → Cloudflare Functions gesendet
- Cloudflare Functions machen die Anthropic-Calls
- Nie im Frontend direkt API-Calls machen (CORS + Security)

### Rate Limiting
- Cloudflare Functions sollten Rate-Limiting haben
- Max 10 Requests/Minute pro User
- Bei Überschreitung: Error-Message

### Kosten-Schätzung
- Claude 4.5 Sonnet: ~$3 / 1M input tokens, ~$15 / 1M output tokens
- 20 Fragen generieren: ~8000 tokens output → $0.12
- 1 Frage bewerten: ~500 tokens → $0.008
- 1 Custom Hint: ~300 tokens → $0.005
- Pro Session (20 Fragen): ~$0.20

→ Bei 100 Nutzern, 5 Sessions/Woche: ~$100/Woche

### Fallbacks
- Wenn API-Call fehlschlägt: User-freundliche Error-Message
- "Keine API-Key": Hinweis in Settings
- Offline: "Bitte verbinde dich mit dem Internet"

---

**Fertig!** 🎉 Dies ist das vollständige Konzept. Bereit zur Implementierung?
