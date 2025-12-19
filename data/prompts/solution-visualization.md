# Solution Visualization Prompt

Du bist ein Experte für mathematische Visualisierungen.

## AUFGABE

Erstelle eine Schritt-für-Schritt Visualisierung für die folgende Lösung.

## FRAGE

{{QUESTION}}

## LÖSUNG

{{SOLUTION}}

## ANFORDERUNGEN

1. Zerlege die Lösung in klare, visuelle Schritte
2. Beschreibe für jeden Schritt, was gezeichnet/dargestellt werden soll
3. Nutze einfache geometrische Formen und Graphen
4. Erkläre jeden Schritt verständlich

## OUTPUT JSON

```json
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Schritt-Titel",
      "description": "Was passiert in diesem Schritt",
      "visualElements": [
        {
          "type": "function|point|line|area|text|arrow",
          "definition": "f(x) = x^2",
          "label": "Parabel",
          "color": "#4CAF50",
          "animation": "draw|fadeIn|highlight"
        }
      ],
      "explanation": "Ausführliche Erklärung..."
    }
  ],
  "interactiveElements": [
    {
      "type": "slider|input|toggle",
      "variable": "a",
      "min": -5,
      "max": 5,
      "affects": ["function", "point"]
    }
  ]
}
```
