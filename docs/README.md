# Seminarkurs Lernapp Mathematik Oberstufe 

## 👥 Teammitglieder

- **GitHub Admin:** Marco Duzevic (GitHub: @md2810)
- **Teammitglied 2:** Joel Dürr (GitHub: @joel12055)
- **Teammitglied 3:** Emmi Lang (GitHub: @emmilang09)
- **Teammitglied 4:** Luisa Schulze (GitHub: @luisaschulzemolly)
- **Teammitglied 5:** Hatice Erdogan (GitHub: @haticeerdogan)

---

## Das Projekt


**Fach & Klassenstufe:** Mathematik, Kursstufe (K1)

**Warum ist das interessant?**

- In der Kursstufe steigen **Abstraktion** und **Transfer** stark an (AFB II/III): z. B. Optimierungsprobleme, Beweise, Modellierung.
- Viele Schüler\*innen haben Probleme mit **Fehlerdiagnose** (wo genau ging’s schief?) und mit **Mehrschrittaufgaben**.
- Eine App kann hier mit **adaptiven Hinweisen**, **sokratischem Tutor**, **interaktiven Visualisierungen (2D/3D)** und **Retrieval/Spacing** unterstützen.

**Konkrete Themenbereiche:**

- **Analysis I/II**: Ableitungen, Kurvendiskussion, Integrale, Anwendungen (Wachstum/Extrema).
- **Analytische Geometrie / Lineare Algebra**: Vektoren, Geraden/Ebenen, Abstände, Lagebeziehungen, LGS.
- **Stochastik**: Binomial-/Normalverteilung, Zufallsvariablen, Schätzer, Hypothesentests (Grundlagen).

**Erste App-Idee (Hauptfeatures):**

- **LLM-Tutor (basierend auf Claude)** mit **Hinweistreppen (H1–H3)**, **Fehlerfeedback** und **Streaming**.
- **Aufgabengenerator + Auto-Korrektor** (SymPy-gestützt): AFB-Tagging (I/II/III), Difficulty-Level, Curriculum-Tags.
- **Interaktive 2D/3D-Grafiken**: LLM erzeugt **MathVizSpec (JSON)** → wird in ReactJS gerendert.
- **Optionale GeoGebra-Einbettung** (WebView + JS-API) für Konstruktionen; Lizenzlage vorab klären.
- **Gamification**: XP/Level/Badges/Streaks, **AFB-Missionen**, Klassen-Challenges (opt-in).
- **Lehrkräfte-Dashboard**: Aufgabenlisten ausspielen, Kompetenzraster, Exporte.

**Zielgruppe genauer:**

- Kursstufe K1; heterogene Vorkenntnisse; Lernort: Schule & Zuhause.
- Tägliche Nutzung 10–20 min (Retrieval), 2–3×/Woche 30–45 min (Üben/Tests).


- **Pro**: Flutter Cross-Platform, stabile LLM-APIs, klare Curriculum-Struktur, erprobte Visualisierungs-Stacks.
- **Contra-Risiken**: GeoGebra-Lizenzklarheit, 3D-Performance auf schwächeren Geräten, Qualitätssicherung LLM-Items → mitigierbar (Validator, Whitelists, Fallbacks).

---

## 🧩 Technisches Konzept (Kurzüberblick)

- **Framework:** ReactJS (Web-App)
- **LLM-Provider:** Anthropic; austauschbar über Service-Interface.
- **Sichere Visualisierung:** LLM → **MathVizSpec (JSON)** → Renderer (2D: `fl_chart`; 3D: `flutter_gl`/`three_dart` oder WebView).
- **GeoGebra-Integration (optional):** WebView-Einbettung (`flutter_inappwebview`) + JS-Bridge (`evalCommand`, Events).
- **Validator-Service:** Python/SymPy für symbolische Checks, LaTeX-Parsing, Numerik.
- **Datenschutz/EU:** Datenminimierung, Pseudonyme, EU-Regionen der Anbieter.

---

## ❓ Offene Fragen

- [ ] GeoGebra-Lizenz für kommerzielle Nutzung / Schul-Lizenzmodell?
- [ ] Wie viel Gamification ist schulverträglich (Streaks/Leaderboard opt-in)?
- [ ] Lehrer-Dashboard: Minimal-Funktionen für MVP?
- [ ] Offline-Fähigkeit nötig (wäre auf schwachen Geräten u.U. nicht möglich; müsste vorher heruntergeladen werden)?

---

## 🔗 Nützliche Links

- GeoGebra GitHub: https://github.com/geogebra
- GeoGebra Apps (Embedding/JS-API): https://www.geogebra.org/documents
- Bildungsplan Baden-Württemberg: https://www.bildungsplaene-bw.de/
