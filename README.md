# Projektideen Team [TEAMNAME]

## 👥 Teammitglieder
- **GitHub Admin:** Marco Duzevic (GitHub: @md2810)
- **Teammitglied 2:** Joel Dürr (GitHub: @joel12055)  
- **Teammitglied 3:** Emmi Lang (GitHub: @emmilang09)
- **Teammitglied 4:** Luisa Schulze (GitHub: @luisaschulzemolly)
- **Teammitglied 5:** Hatice Erdogan (GitHub: @haticeerdogan)

---

## 💡 Fach-Ideen

### Idee 1: Mathematik (Kursstufe / Oberstufe J1–J2)

**Eingereicht von:** Marco

**Fach & Klassenstufe:** Mathematik, Kursstufe (Oberstufe J1/J2)

**Warum ist das interessant?**
- In der Kursstufe steigen **Abstraktion** und **Transfer** stark an (AFB II/III): z. B. Optimierungsprobleme, Beweise, Modellierung.
- Viele Schüler*innen haben Probleme mit **Fehlerdiagnose** (wo genau ging’s schief?) und mit **Mehrschrittaufgaben**.
- Eine App kann hier mit **adaptiven Hinweisen**, **sokratischem Tutor**, **interaktiven Visualisierungen (2D/3D)** und **Retrieval/Spacing** unterstützen.

**Konkrete Themenbereiche:**
- **Analysis I/II**: Ableitungen, Kurvendiskussion, Integrale, Anwendungen (Wachstum/Extrema).
- **Analytische Geometrie / Lineare Algebra**: Vektoren, Geraden/Ebenen, Abstände, Lagebeziehungen, LGS.
- **Stochastik**: Binomial-/Normalverteilung, Zufallsvariablen, Schätzer, Hypothesentests (Grundlagen).

**Erste App-Idee (Hauptfeatures):**
- **LLM-Tutor (OpenAI/Claude)** mit **Hinweistreppen (H1–H3)**, **Fehlerfeedback** und **Streaming**.
- **Aufgabengenerator + Auto-Korrektor** (SymPy-gestützt): AFB-Tagging (I/II/III), Difficulty-Level, Curriculum-Tags.
- **Interaktive 2D/3D-Grafiken**: LLM erzeugt **MathVizSpec (JSON)** → Flutter rendert sicher (kein Fremdcode).
- **Optionale GeoGebra-Einbettung** (WebView + JS-API) für Konstruktionen; Lizenzlage vorab klären.
- **Gamification**: XP/Level/Badges/Streaks, **AFB-Missionen**, Klassen-Challenges (opt-in).
- **Lehrkräfte-Dashboard**: Aufgabenlisten ausspielen, Kompetenzraster, Exporte.

**Zielgruppe genauer:**
- Kursstufe J1/J2; heterogene Vorkenntnisse; Lernort: Schule & Zuhause.
- Tägliche Nutzung 10–20 min (Retrieval), 2–3×/Woche 30–45 min (Üben/Tests).

**Machbarkeit (1–10):** 8/10  
- **Pro**: Flutter Cross-Platform, stabile LLM-APIs, klare Curriculum-Struktur, erprobte Visualisierungs-Stacks.  
- **Contra-Risiken**: GeoGebra-Lizenzklarheit, 3D-Performance auf schwächeren Geräten, Qualitätssicherung LLM-Items → mitigierbar (Validator, Whitelists, Fallbacks).

---

### Idee 2: [Fach] für Klasse [X]

**Eingereicht von:** [Vorname]

**Fach & Klassenstufe:** 

**Warum ist das interessant?**
- 
- 
- 

**Konkrete Themenbereiche:**
- 

**Erste App-Idee:**
- 
- 
- 

**Zielgruppe genauer:**
- 
- 
- 

**Machbarkeit (1-10):** [X]/10
- Begründung: 

---

### Idee 3: [Fach] für Klasse [X]

**Eingereicht von:** [Vorname]

**Fach & Klassenstufe:** 

**Warum ist das interessant?**
- 
- 
- 

**Konkrete Themenbereiche:**
- 

**Erste App-Idee:**
- 
- 
- 

**Zielgruppe genauer:**
- 
- 
- 

**Machbarkeit (1-10):** [X]/10
- Begründung: 

---

## 🎯 Team-Entscheidung

### Aktueller Stand
**Favorit (noch nicht final):** Mathematik, Kursstufe (Oberstufe J1/J2)  
**Hauptthema (MVP-Start):** Analysis I – Differentialrechnung & Kurvendiskussion

### Begründung (Kurz):
- Hoher Bedarf bei Transfer-/Modellierungsaufgaben (AFB II/III).
- Interaktive Visualisierungen (Tangenten, Flächen, Ebenen) erhöhen Verständnis.
- LLM-Tutor + adaptives Üben ermöglicht **personalisierte Hilfe** und **schnelles Feedback**.

### Grobe App-Beschreibung (2–3 Sätze):
Eine Flutter-App für die Kursstufe Mathematik mit **LLM-Tutor**, **Aufgabengenerator**, **automatischer Korrektur** und **interaktiven 2D/3D-Grafiken**. Inhalte werden **bildungsplankonform** getaggt (AFB I–III, Kompetenzen) und über **Gamification** motivierend präsentiert. Lehrkräfte erhalten ein **Dashboard** zur Aufgabenverteilung und Lernstandssicht.

### Erste Recherche-Ergebnisse (Kurzfassung):
- **Was lernen die Schüler in diesem Bereich?** Analysis (Ableiten/Inte­grie­ren, Anwendungen), Geo/LA (Vektoren, Ebenen), Stochastik (Verteilungen, Tests).
- **Typische Probleme:** Formalisierung, Mehrschrittaufgaben, Fehlerdiagnose, Transfer auf Anwendungsaufgaben.
- **Welche Apps gibt es schon dazu?** GeoGebra (Konstruktion/Graphing), Photomath/Symbolab (Lösungswege), Khan Academy (Videos/Übungen).
- **Was können wir besser machen?** **Curriculum-Tagging + AFB**, **Hinweistreppen statt Komplettlösung**, **sichere LLM-Visualisierung (JSON-Spec)**, **Lehrer-Workflows**, **EU-Datenschutz**.

---

## 🧩 Technisches Konzept (Kurzüberblick)

- **Framework:** Flutter (iOS/Android/Web/Desktop).  
- **LLM-Provider:** OpenAI **oder** Anthropic; austauschbar über Service-Interface.  
- **Sichere Visualisierung:** LLM → **MathVizSpec (JSON)** → Renderer (2D: `fl_chart`; 3D: `flutter_gl`/`three_dart` oder WebView).  
- **GeoGebra-Integration (optional):** WebView-Einbettung (`flutter_inappwebview`) + JS-Bridge (`evalCommand`, Events).  
- **Validator-Service:** Python/SymPy für symbolische Checks, LaTeX-Parsing, Numerik.  
- **Datenschutz/EU:** Datenminimierung, Pseudonyme, EU-Regionen der Anbieter.

---

## 📋 Aufgaben bis nächste Woche

- [ ] **Marco:** Bildungsplan/KMK-Mapping (AFB/Kompetenzen) finalisieren bis 24.09.2025
- [ ] **Joel:** 3 bestehende Apps (GeoGebra, Photomath, Khan Academy) analysieren bis 24.09.2025  
- [ ] **Emmi:** Umfrage-Fragen für Schüler/Lehrkräfte entwerfen bis 24.09.2025
- [ ] **Luisa:** Technische Machbarkeit (LLM-API, Visualisierung, SymPy) prüfen bis 24.09.2025
- [ ] **Hatice:** 5-Min-Pitch/Präsentation (Problem, Lösung, Demo-Mock) vorbereiten bis 24.09.2025
- [ ] **Alle:** Ideen konsolidieren → MVP-Scope für Analysis I definieren bis 24.09.2025

---

## 📝 Meeting-Notizen

### Meeting 1 (17.09.2025)
**Anwesend:** Marco, Joel, Emmi, Luisa, Hatice  
**Beschlossen:**
- Fokus auf **Mathematik Kursstufe**, Start mit **Analysis I** als MVP.
- Visualisierung sicher über **MathVizSpec (JSON)**; **GeoGebra-Integration** prüfen.

**Nächste Schritte:**
- Lizenz-/Nutzungsbedingungen GeoGebra klären.
- Prototyp: 1 Screen „Funktion + Tangente“ (2D) und 1 Screen „Ebene + Gerade“ (3D).

---

## ❓ Offene Fragen

- [ ] GeoGebra-Lizenz für kommerzielle Nutzung / Schul-Lizenzmodell?
- [ ] LLM-Provider-Entscheidung (OpenAI vs. Claude) + EU-Datenresidenz?
- [ ] Wie viel Gamification ist schulverträglich (Streaks/Leaderboard opt-in)?
- [ ] Lehrer-Dashboard: Minimal-Funktionen für MVP?
- [ ] Offline-Fähigkeit nötig (schwaches WLAN in Schulen)?

---

## 🔗 Nützliche Links

- GeoGebra GitHub: https://github.com/geogebra
- GeoGebra Apps (Embedding/JS-API): https://www.geogebra.org/documents
- Bildungsplan Baden-Württemberg: https://www.bildungsplaene-bw.de/
- Lern-Apps im Play Store: https://play.google.com/store/apps/category/EDUCATION

---

💡 **Tipp:** Denkt nicht zu kompliziert! Eine einfache, **gut funktionierende** App ist besser als eine komplexe, die nicht richtig läuft.

---

<!--
Anhang: Vorheriger Stand (Backup-Hinweis)
Ein Backup der ursprünglichen Datei wurde – falls vorhanden – als Ideenfindung.backup.md gespeichert.
-->
