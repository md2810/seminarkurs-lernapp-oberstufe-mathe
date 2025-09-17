# Seminarkurs Lernapp · Mathematik Oberstufe

## 👥 Team

- **GitHub Admin:** Marco Duzevic (GitHub: @md2810)
- **Teammitglied 2:** Joel Dürr (GitHub: @joel12055)
- **Teammitglied 3:** Emmi Lang (GitHub: @emmilang09)
- **Teammitglied 4:** Luisa Schulze (GitHub: @luisaschulzemolly)
- **Teammitglied 5:** Hatice Erdogan (GitHub: @haticeerdogan)

## 🎯 Projektüberblick

**Fach & Stufe:** Mathematik, Kursstufe (K1)

**Warum relevant?**

- Stärkerer Fokus auf **Abstraktion** & **Transfer** (AFB II/III), z. B. Optimierung, Modellierung, Beweise
- Häufige Hürden: **Fehlerdiagnose** und **Mehrschrittaufgaben**
- Lösungsidee: **adaptiver Tutor (LLM)**, **interaktive 2D/3D-Visualisierungen**, **Retrieval/Spacing**

**Themenfelder (Beispiele):**

- **Analysis I/II:** Ableitungen, Kurvendiskussion, Integrale, Anwendungen
- **Analytische Geometrie / LA:** Vektoren, Geraden/Ebenen, Abstände, Lage, LGS
- **Stochastik:** Binomial-/Normalverteilung, Zufallsvariablen, Schätzer, einfache Tests

**Hauptfeatures (MVP-Idee):**

- **LLM-Tutor (Claude)** mit **Hinweistreppen (H1–H3)**, **Fehlerfeedback** und **Streaming**
- **Aufgabengenerator + Auto‑Korrektor** (Server‑Validator mit SymPy): AFB‑Tagging, Difficulty, Curriculum‑Tags
- **Interaktive 2D/3D‑Grafiken:** LLM erzeugt **MathVizSpec (JSON)** → React‑Renderer (2D/3D)
- **Optionale GeoGebra‑Einbettung:** per `<iframe>` oder GeoGebra **JS‑API** (Lizenz prüfen)
- **Gamification:** XP/Level/Badges/Streaks, AFB‑Missionen, Klassen‑Challenges (opt‑in)
- **Lehrkräfte‑Dashboard:** Aufgabenlisten, Kompetenzraster, Exporte

## 🧩 Technische Architektur (Web, Vite + React + **JavaScript**)

### Frontend (Vite + React)

- **Stack:** Vite, React, JavaScript (ESM), CSS (optional Tailwind)
- **State/Server‑State:** leichtgewichtig (z. B. React Context) oder TanStack Query
- **Visualisierung 2D:** **Recharts** (Startpunkt)
  _Alternativen:_ Visx, Nivo, react-chartjs-2
- **Visualisierung 3D:** **three.js** + **@react-three/fiber** (+ **@react-three/drei**)
- **Mathe‑Rendering:** **KaTeX** (schnell) oder **MathJax**
- **Formeleingabe (optional):** **mathlive**
- **Sichere Visualisierung:** `MathVizSpec (JSON)` wird clientseitig gerendert; nur **whitelistete** Chart‑Typen/Props; **kein eval**

### Backend (Node.js)

- **API‑Gateway:** Node/Express (oder Vite/Next API‑Routen) als Proxy zu LLM & Python‑Service
- **Streaming:** Server‑Sent Events (SSE) oder WebSocket → Frontend zeigt Token‑Stream live an
- **Secrets:** API‑Keys **nur** serverseitig; Browser erhält nie Secrets

### Validator‑Service (Python)

- **Zweck:** symbolische Checks (SymPy), LaTeX‑Parsing, Numerik, Randomisierung für Item‑Varianten
- **API:** z. B. FastAPI (REST); Kommunikation nur über Node‑Backend

### GeoGebra‑Integration (optional)

- **Einbettung:** `<iframe>` **oder** GeoGebra JS‑API im DOM
- **Events/Kommandos:** über die offizielle JS‑API; keine WebView/Bridge nötig

---

## 🔐 Sicherheit & Datenschutz

- **Keys/Secrets** bleiben **immer** auf dem Server (ENV‑Variablen, niemals im Client bundlen)
- **Input‑Validierung:** Zod/JSON‑Schema + serverseitige Whitelists für `MathVizSpec`
- **CSP/Headers:** strikte `Content‑Security‑Policy`, `X‑Frame‑Options`, `Referrer‑Policy`
- **Datenminimierung:** Pseudonyme, Löschkonzept, EU‑Regionen bei Providern bevorzugen

## ❓ Offene Punkte

- [ ] GeoGebra‑Lizenz (kommerziell/Schule)
- [ ] Umfang Gamification (pädagogisch sinnvoll?)
- [ ] Offline‑Fähigkeit (falls gefordert)

## 🔗 Nützliche Links

- GeoGebra GitHub: [https://github.com/geogebra](https://github.com/geogebra)
- GeoGebra Apps (Embedding/JS‑API): [https://www.geogebra.org/documents](https://www.geogebra.org/documents)
- Bildungsplan Baden‑Württemberg: [https://www.bildungsplaene-bw.de/](https://www.bildungsplaene-bw.de/)
