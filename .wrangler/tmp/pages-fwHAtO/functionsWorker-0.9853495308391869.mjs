var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-xdaIZr/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// ../data/bw_oberstufe_themen.json
var bw_oberstufe_themen_default = {
  Klassen_11_12: {
    Leistungsfach: {
      "3.4.1 Leitidee Zahl \u2013 Variable \u2013 Operation": {
        "Zahlenwerte approximieren": [
          "die eulersche Zahl e n\xE4herungsweise bestimmen"
        ],
        "weitere Ableitungsregeln anwenden": [
          "ein iteratives Verfahren zur n\xE4herungsweisen Bestimmung von Nullstellen begr\xFCnden und durchf\xFChren",
          "die Produkt- und Kettenregel zum Ableiten von Funktionen verwenden",
          "gebrochenrationale Funktionen durch Verbindung der Ableitungsregeln in einfachen F\xE4llen ableiten (z.\u202FB. f(x)=2/(3x^2\u22124), nicht jedoch f(x)=x/(3x^2\u22124))"
        ],
        "Integrationsregeln verwenden und Integrale berechnen": [
          "die Potenzregel, die Regel f\xFCr konstanten Faktor, die Summenregel sowie das Verfahren der linearen Substitution f\xFCr die Bestimmung einer Stammfunktion verwenden",
          "Stammfunktionsterme zu den Funktionstermen sin(x), cos(x), e^x, 1/x angeben",
          "den Hauptsatz der Differential- und Integralrechnung zur Berechnung von bestimmten Integralen nutzen",
          "uneigentliche Integrale untersuchen"
        ],
        "Produkte von Vektoren bilden": [
          "das Skalarprodukt berechnen, geometrisch interpretieren und bei Berechnungen nutzen",
          "das Vektorprodukt berechnen, geometrisch interpretieren und bei Berechnungen nutzen"
        ],
        "Gau\xDF-Algorithmus verwenden": [
          "das Gau\xDFverfahren zum L\xF6sen eines linearen Gleichungssystems als ein Beispiel f\xFCr ein algorithmisches Verfahren erl\xE4utern",
          "das Gau\xDFverfahren, auch in Matrixschreibweise, zum L\xF6sen eines linearen Gleichungssystems durchf\xFChren",
          "die L\xF6sungsmenge eines linearen 3\xD73\u2011Gleichungssystems geometrisch interpretieren"
        ]
      },
      "3.4.2 Leitidee Messen": {
        "Winkelweiten, Abst\xE4nde und Fl\xE4cheninhalte in kartesischen Koordinatensystemen berechnen": [
          "die Orthogonalit\xE4t zweier Vektoren mithilfe des Skalarprodukts \xFCberpr\xFCfen",
          "Winkelweiten mithilfe des Skalarprodukts bestimmen",
          "Schnittwinkel zwischen geometrischen Objekten (Geraden und Ebenen) bestimmen",
          "die Hesse\u2019sche Normalenform einer Ebenengleichung zur Berechnung des Abstands eines Punktes zu einer Ebene anwenden",
          "Abst\xE4nde zwischen den geometrischen Objekten Punkt, Gerade und Ebene (auch zwischen windschiefen Geraden) ermitteln",
          "das Vektorprodukt zum Ermitteln von Fl\xE4cheninhalten anwenden"
        ],
        "das Integral nutzen": [
          "das bestimmte Integral als Grenzwert einer Summe erl\xE4utern und geometrisch deuten",
          "den Mittelwert einer Funktion auf einem Intervall berechnen",
          "Fl\xE4cheninhalte zwischen Graph und x\u2011Achse und zwischen zwei Graphen bestimmen",
          "das Volumen von K\xF6rpern berechnen, die durch Rotation von Fl\xE4chen um die x\u2011Achse entstehen"
        ]
      },
      "3.4.3 Leitidee Raum und Form": {
        "Produkte von Vektoren geometrisch nutzen": [
          "das Skalarprodukt und das Vektorprodukt geometrisch deuten",
          "einen gemeinsamen orthogonalen Vektor zu zwei Vektoren bestimmen"
        ],
        "vektorielle Darstellungen zur Beschreibung des Anschauungsraumes verwenden": [
          "Ebenen mithilfe von Spurpunkten und Spurgeraden im Schr\xE4gbild eines Koordinatensystems veranschaulichen",
          "Ebenen mithilfe einer Parameterdarstellung, einer Koordinatengleichung und einer Normalengleichung analytisch beschreiben",
          "eine Parameterdarstellung einer Ebene in eine Normalengleichung und in eine Koordinatengleichung umrechnen",
          "zwischen Gerade\u2013Ebene und Ebene\u2013Ebene die Lagebeziehung untersuchen sowie gegebenenfalls die Schnittgebilde rechnerisch bestimmen",
          "Problemstellungen, wie z.\u202FB. Spiegelung eines Punktes an einer Ebene, Spiegelung einer Geraden an einen Punkt, Abstands\u2011, Fl\xE4cheninhalts\u2011 und Volumenberechnungen sowie Untersuchungen geradliniger Bewegungen, im Raum bearbeiten"
        ],
        "vektorielle Darstellungen beim Beweisen nutzen": [
          "einfache mathematische Aussagen und S\xE4tze beweisen (z.\u202FB. \u201EIn einem Trapez ist die Mittellinie parallel zu den Grundseiten\u201C, \u201EDie Seitenmitten eines r\xE4umlichen Vierecks bilden die Eckpunkte eines Parallelogramms\u201C, \u201EIn einer Raute sind die Diagonalen zueinander orthogonal\u201C, Satz des Thales)"
        ]
      },
      "3.4.4 Leitidee Funktionaler Zusammenhang": {
        "mit der nat\xFCrlichen Exponential\u2011 und Logarithmusfunktion umgehen": [
          "die besondere Bedeutung der Basis e bei Exponentialfunktionen erl\xE4utern",
          "die Graphen der nat\xFCrlichen Exponential\u2011 und Logarithmusfunktion unter Verwendung charakteristischer Eigenschaften skizzieren und die Beziehung zwischen den Graphen beschreiben, auch unter dem Aspekt der Umkehrfunktion",
          "charakteristische Eigenschaften der Funktion f mit f(x)=e^x beschreiben",
          "die Ableitungsfunktion und eine Stammfunktion der Funktion f mit f(x)=e^x angeben",
          "die Ableitungsfunktion der Funktion f mit f(x)=ln(x) angeben"
        ],
        "mit Umkehrfunktionen arbeiten": [
          "Definitionsmengen und Wertemengen von Funktionen bestimmen und den Zusammenhang zwischen der Wertemenge einer Funktion und der Definitionsmenge ihrer Umkehrfunktion erl\xE4utern",
          "die strenge Monotonie einer Funktion verwenden, um ihre Umkehrbarkeit nachzuweisen, und die Nichtumkehrbarkeit einer Funktion anhand ihrer charakteristischen Eigenschaften begr\xFCnden",
          "zu einer gegebenen umkehrbaren Funktion den Term ihrer Umkehrfunktion bestimmen"
        ],
        "mit zusammengesetzten Funktionen umgehen": [
          "Funktionen verketten und Verkettungen von Funktionen erkennen",
          "die Graphen von Funktionen in einfachen F\xE4llen auf waagrechte und senkrechte Asymptoten und Nullstellen untersuchen, deren Funktionsterm als Quotient zuvor behandelter Funktionstypen gebildet werden kann",
          "Graphen von zusammengesetzten Funktionen (Summe, Produkt, Verkettung) untersuchen"
        ],
        "Differentialrechnung anwenden": [
          "Extremwertprobleme mit Nebenbedingungen l\xF6sen",
          "einen Funktionsterm zu gegebenen Eigenschaften eines Graphen ermitteln",
          "bei Funktionsscharen einzelne Fragestellungen zu Eigenschaften ihrer Graphen oder zu Zusammenh\xE4ngen zwischen den Graphen untersuchen"
        ],
        "die Grundidee der Integralrechnung verstehen und mit Integralen umgehen": [
          "den Wert des bestimmten Integrals als orientierten Fl\xE4cheninhalt und als Bestandsver\xE4nderung erkl\xE4ren",
          "Funktionen aus ihren \xC4nderungsraten rekonstruieren",
          "den Bestand aus Anfangsbestand und \xC4nderungsraten bestimmen",
          "den Inhalt des Hauptsatzes der Differential\u2011 und Integralrechnung angeben",
          "die Begriffe Integralfunktion und Stammfunktion gegeneinander abgrenzen",
          "vom Graphen der Funktion auf den Graphen einer Stammfunktion schlie\xDFen und umgekehrt",
          "den Hauptsatz der Differential\u2011 und Integralrechnung in Begr\xFCndungszusammenh\xE4ngen (z.\u202FB. zum Nachweis der Linearit\xE4t des Integrals) nutzen",
          "die Linearit\xE4t des Integrals anschaulich begr\xFCnden und rechen\xF6konomisch nutzen"
        ]
      },
      "3.4.5 Leitidee Daten und Zufall": {
        "Hypothesen bei binomialverteilten Zufallsgr\xF6\xDFen testen": [
          "das Argumentationsmuster erl\xE4utern, das dem Testen von Hypothesen zugrunde liegt",
          "eine Nullhypothese so formulieren, dass sie der Zielsetzung des Tests entspricht",
          "Ablehnungsbereich und Irrtumswahrscheinlichkeit an einem Histogramm erl\xE4utern",
          "ein\u2011 und zweiseitige Hypothesentests durchf\xFChren und den Ablehnungsbereich, die Entscheidungsregel und die Irrtumswahrscheinlichkeit angeben",
          "Signifikanzniveau und Irrtumswahrscheinlichkeit gegeneinander abgrenzen",
          "Fehler erster und zweiter Art im Kontext eines Hypothesentests erl\xE4utern",
          "den Einfluss des Stichprobenumfangs auf die Wahrscheinlichkeiten f\xFCr den Fehler erster Art (das Risiko erster Art) und f\xFCr den Fehler zweiter Art (das Risiko zweiter Art) angeben"
        ],
        "mit Normalverteilungen umgehen": [
          "den Unterschied zwischen diskreten und stetigen Zufallsgr\xF6\xDFen erl\xE4utern, insbesondere am Beispiel binomial\u2011 und normalverteilter Zufallsgr\xF6\xDFen",
          "die Dichtefunktion einer normalverteilten Zufallsgr\xF6\xDFe mithilfe von Erwartungswert und Standardabweichung angeben und die zugeh\xF6rige Glockenkurve skizzieren",
          "stochastische Situationen untersuchen, die zu ann\xE4hernd normalverteilten Zufallsgr\xF6\xDFen geh\xF6ren, und Wahrscheinlichkeiten berechnen"
        ]
      }
    },
    Basisfach: {
      "3.5.1 Leitidee Zahl \u2013 Variable \u2013 Operation": {
        "den nat\xFCrlichen Logarithmus nutzen": [
          "den nat\xFCrlichen Logarithmus einer Zahl als L\xF6sung einer Exponentialgleichung verwenden"
        ],
        "weitere Ableitungsregeln anwenden": [
          "die Produktregel zum Ableiten von Funktionstermen verwenden",
          "die Kettenregel zum Ableiten von Funktionstermen verwenden, bei denen die innere Funktion eine lineare Funktion ist"
        ],
        "Integrationsregeln verwenden und Integrale berechnen": [
          "die Potenzregel, die Regel f\xFCr konstanten Faktor, die Summenregel sowie das Verfahren der linearen Substitution f\xFCr die Bestimmung einer Stammfunktion verwenden",
          "Stammfunktionsterme zu den Funktionstermen sin(x), cos(x), e^x, 1/x angeben",
          "den Hauptsatz der Differential\u2011 und Integralrechnung zur Berechnung von bestimmten Integralen nutzen"
        ],
        "Produkte von Vektoren bilden": [
          "das Skalarprodukt berechnen und bei Berechnungen nutzen",
          "das Vektorprodukt berechnen und bei Berechnungen nutzen"
        ],
        "lineare Gleichungssysteme untersuchen": [
          "das Gau\xDFverfahren, auch in Matrixschreibweise, auf lineare Gleichungssysteme ohne Parameter bis zur Stufenform anwenden",
          "die L\xF6sungsvielfalt linearer Gleichungssysteme ohne Parameter angeben und im Falle eindeutiger L\xF6sbarkeit deren L\xF6sung bestimmen"
        ]
      },
      "3.5.2 Leitidee Messen": {
        "Winkelweiten, Abst\xE4nde und Fl\xE4cheninhalte in kartesischen Koordinatensystemen berechnen": [
          "die Orthogonalit\xE4t zweier Vektoren mithilfe des Skalarprodukts \xFCberpr\xFCfen",
          "Winkelweiten mithilfe des Skalarprodukts bestimmen",
          "Schnittwinkel zwischen geometrischen Objekten (Geraden und Ebenen) bestimmen",
          "den Abstand zwischen den geometrischen Objekten Punkt und Ebene ermitteln",
          "das Vektorprodukt zum Ermitteln von Fl\xE4cheninhalten anwenden"
        ],
        "das Integral nutzen": [
          "das bestimmte Integral mithilfe eines Grenzprozesses anschaulich beschreiben und geometrisch deuten",
          "Fl\xE4cheninhalte zwischen Graph und x\u2011Achse und zwischen zwei Graphen bestimmen"
        ]
      },
      "3.5.3 Leitidee Raum und Form": {
        "Produkte von Vektoren geometrisch nutzen": [
          "das Skalarprodukt und das Vektorprodukt geometrisch deuten",
          "einen gemeinsamen orthogonalen Vektor zu zwei Vektoren bestimmen"
        ],
        "vektorielle Darstellungen zur Beschreibung des Anschauungsraumes verwenden": [
          "Ebenen mithilfe von Spurpunkten und Spurgeraden im Schr\xE4gbild eines Koordinatensystems veranschaulichen",
          "Ebenen mithilfe einer Parameterdarstellung und einer Koordinatengleichung analytisch beschreiben",
          "eine Parameterdarstellung einer Ebene in eine Koordinatengleichung umrechnen",
          "die Lagebeziehung zwischen einer Geraden und einer Ebene untersuchen und gegebenenfalls deren Schnittpunkt rechnerisch bestimmen",
          "die Lagebeziehung zwischen zwei Ebenen erkennen und begr\xFCnden",
          "Problemstellungen, wie z.\u202FB. Spiegelung eines Punktes an einer Ebene, Fl\xE4cheninhalts\u2011 und Volumenberechnungen bearbeiten, sowie geradlinige Bewegungen untersuchen"
        ]
      },
      "3.5.4 Leitidee Funktionaler Zusammenhang": {
        "mit der nat\xFCrlichen Exponentialfunktion umgehen": [
          "die besondere Bedeutung der Basis e bei Exponentialfunktionen beschreiben",
          "charakteristische Eigenschaften der Funktion f mit f(x)=e^x beschreiben und deren Graph mit dessen waagrechter Asymptote skizzieren",
          "die Ableitungsfunktion und eine Stammfunktion der Funktion f mit f(x)=e^x angeben"
        ],
        "mit zusammengesetzten Funktionen umgehen": [
          "Verkettungen von Funktionen erkennen, falls die innere Funktion eine lineare Funktion ist",
          "Graphen von zusammengesetzten Funktionen (Summe, Produkt, Verkettung mit linearer innerer Funktion) untersuchen"
        ],
        "Differentialrechnung anwenden": [
          "Extremwerte auch in au\xDFermathematischen Sachzusammenh\xE4ngen bestimmen",
          "einen Funktionsterm ermitteln, falls dieser durch die Eigenschaften eines Graphen eindeutig festgelegt ist"
        ],
        "die Grundidee der Integralrechnung verstehen und mit Integralen umgehen": [
          "den Wert des bestimmten Integrals als orientierten Fl\xE4cheninhalt und als Bestandsver\xE4nderung deuten",
          "Funktionen aus ihren \xC4nderungsraten rekonstruieren",
          "den Bestand aus Anfangsbestand und \xC4nderungsraten bestimmen",
          "den Hauptsatz der Differential\u2011 und Integralrechnung anwenden",
          "vom Graphen der Funktion auf den Graphen einer Stammfunktion schlie\xDFen und umgekehrt",
          "die Linearit\xE4t des Integrals anschaulich begr\xFCnden und rechen\xF6konomisch nutzen"
        ]
      },
      "3.5.5 Leitidee Daten und Zufall": {
        "mit Normalverteilungen umgehen": [
          "den Unterschied zwischen diskreten und stetigen Zufallsgr\xF6\xDFen am Beispiel binomial\u2011 und normalverteilter Zufallsgr\xF6\xDFen beschreiben",
          "den Zusammenhang der Kenngr\xF6\xDFen Erwartungswert und Standardabweichung einer Normalverteilung und der zugeh\xF6rigen Glockenkurve beschreiben",
          "stochastische Situationen untersuchen, die zu ann\xE4hernd normalverteilten Zufallsgr\xF6\xDFen geh\xF6ren, und Wahrscheinlichkeiten berechnen"
        ]
      }
    }
  }
};

// api/analyze-image.js
async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { apiKey, image, gradeLevel, courseType } = body;
    if (!apiKey || !image || !gradeLevel || !courseType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: apiKey, image, gradeLevel, courseType"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const curriculum = bw_oberstufe_themen_default.Klassen_11_12[courseType];
    if (!curriculum) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid courseType"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const prompt = `Du bist ein Experte f\xFCr den Baden-W\xFCrttemberg Bildungsplan Mathematik Oberstufe.

Der Nutzer hat ein Bild einer Themenliste hochgeladen (z.B. f\xFCr eine Klausur).

DEINE AUFGABE:
1. Analysiere das Bild und extrahiere alle sichtbaren mathematischen Themen
2. Mappe die Themen auf den offiziellen BW-Bildungsplan
3. Gib die Themen im strukturierten Format zur\xFCck

KONTEXT:
- Klassenstufe: ${gradeLevel}
- Kurstyp: ${courseType}

BILDUNGSPLAN:
${JSON.stringify(curriculum, null, 2)}

WICHTIG:
- Extrahiere nur Themen, die im Bild klar lesbar sind
- Mappe sie auf die exakten Bezeichnungen aus dem Bildungsplan
- Gib eine Confidence an (0-1), wie sicher du bei der Zuordnung bist
- Wenn ein Thema nicht genau passt, gib Vorschl\xE4ge

Gib deine Antwort als JSON zur\xFCck (NUR das JSON, keine weiteren Erkl\xE4rungen):
{
  "extractedTopics": [
    {
      "leitidee": "3.4.1 Leitidee Zahl \u2013 Variable \u2013 Operation",
      "thema": "weitere Ableitungsregeln anwenden",
      "unterthema": "die Produkt- und Kettenregel zum Ableiten von Funktionen verwenden",
      "confidence": 0.95
    }
  ],
  "suggestions": ["Falls Themen nicht klar zugeordnet werden konnten"]
}`;
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: image
                }
              },
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ]
      })
    });
    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.json();
      return new Response(
        JSON.stringify({
          success: false,
          error: "Anthropic API error",
          details: error
        }),
        { status: anthropicResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }
    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content[0].text;
    let extractedData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = JSON.parse(responseText);
      }
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to parse Claude response",
          rawResponse: responseText
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const matchedTopics = extractedData.extractedTopics.filter((topic) => {
      const leitideeExists = curriculum[topic.leitidee];
      if (!leitideeExists) return false;
      const themaExists = leitideeExists[topic.thema];
      if (!themaExists) return false;
      return themaExists.includes(topic.unterthema);
    });
    return new Response(
      JSON.stringify({
        success: true,
        extractedTopics: matchedTopics,
        matchedFromCurriculum: matchedTopics.length > 0,
        suggestions: extractedData.suggestions || [],
        totalFound: extractedData.extractedTopics.length,
        totalMatched: matchedTopics.length
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-image:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(onRequestPost, "onRequestPost");
async function onRequestGet(context) {
  return new Response(
    JSON.stringify({
      endpoint: "/api/analyze-image",
      method: "POST",
      description: "Analyzes uploaded images of topic lists using Claude Vision",
      requiredFields: ["apiKey", "image (base64)", "gradeLevel", "courseType"]
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
__name(onRequestGet, "onRequestGet");

// api/auth.js
async function onRequestPost2(context) {
  try {
    const body = await context.request.json();
    const { username, password } = body;
    if (username === "admin" && password === "admin") {
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            username: "admin",
            level: 7,
            xp: 1250,
            streak: 12
          },
          message: "Login erfolgreich!"
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            // In production: set secure session cookies or JWT tokens
            "Set-Cookie": "auth_session=demo_session; HttpOnly; Secure; SameSite=Strict; Max-Age=86400"
          }
        }
      );
    }
    return new Response(
      JSON.stringify({
        success: false,
        message: "Ung\xFCltiger Benutzername oder Passwort"
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Server-Fehler"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(onRequestPost2, "onRequestPost");
async function onRequestGet2(context) {
  return new Response(
    JSON.stringify({
      message: "Auth endpoint - use POST to login"
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
__name(onRequestGet2, "onRequestGet");

// api/evaluate-answer.js
async function onRequestPost3(context) {
  try {
    const body = await context.request.json();
    const { apiKey, userId, questionId, questionData, userAnswer, hintsUsed, timeSpent, skipped } = body;
    if (!questionData || userAnswer === void 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    let isCorrect = false;
    let correctAnswer = null;
    let feedback = "";
    if (questionData.type === "multiple-choice") {
      correctAnswer = questionData.options.find((opt) => opt.isCorrect)?.id;
      isCorrect = userAnswer === correctAnswer;
      if (isCorrect) {
        feedback = `Richtig! ${questionData.explanation}`;
      } else {
        const userOption = questionData.options.find((opt) => opt.id === userAnswer);
        feedback = `Leider falsch. Du hast ${userOption?.text || "keine Antwort"} gew\xE4hlt. Die richtige Antwort ist ${correctAnswer}. ${questionData.explanation}`;
      }
    } else if (questionData.type === "step-by-step") {
      const stepResults = questionData.steps.map((step, index) => {
        const userStepAnswer = userAnswer[index];
        const expected = parseFloat(step.expectedAnswer);
        const actual = parseFloat(userStepAnswer);
        const tolerance = step.tolerance || 0.01;
        const stepCorrect = Math.abs(expected - actual) <= tolerance;
        return {
          stepNumber: step.stepNumber,
          correct: stepCorrect,
          expected: step.expectedAnswer,
          actual: userStepAnswer
        };
      });
      isCorrect = stepResults.every((r) => r.correct);
      correctAnswer = questionData.steps.map((s) => s.expectedAnswer);
      if (isCorrect) {
        feedback = `Alle Schritte korrekt! ${questionData.explanation}`;
      } else {
        const wrongSteps = stepResults.filter((r) => !r.correct).map((r) => r.stepNumber);
        feedback = `Nicht alle Schritte waren korrekt. Fehler in Schritt(en): ${wrongSteps.join(", ")}. ${questionData.explanation}`;
      }
    }
    const BASE_XP = {
      1: 10,
      2: 15,
      3: 20,
      4: 30,
      5: 50
    };
    let baseXp = BASE_XP[questionData.difficulty] || 20;
    if (skipped) {
      return new Response(
        JSON.stringify({
          success: true,
          isCorrect: false,
          feedback: "Frage \xFCbersprungen",
          correctAnswer,
          xpEarned: 0,
          xpBreakdown: {
            base: baseXp,
            hintPenalty: -baseXp,
            timePenalty: 0,
            bonuses: 0,
            total: 0
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!isCorrect) {
      return new Response(
        JSON.stringify({
          success: true,
          isCorrect: false,
          feedback,
          correctAnswer,
          xpEarned: 0,
          xpBreakdown: {
            base: baseXp,
            hintPenalty: 0,
            timePenalty: 0,
            bonuses: 0,
            total: 0
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    const HINT_PENALTY_MULTIPLIER = {
      0: 1,
      // 100%
      1: 0.85,
      // 85%
      2: 0.65,
      // 65%
      3: 0.4
      // 40%
    };
    let xp = baseXp;
    const hintMultiplier = HINT_PENALTY_MULTIPLIER[Math.min(hintsUsed || 0, 3)];
    const hintPenalty = baseXp * (1 - hintMultiplier);
    xp *= hintMultiplier;
    let timeBonus = 0;
    const expectedTime = questionData.difficulty * 60;
    if (timeSpent && timeSpent < expectedTime * 0.5) {
      timeBonus = baseXp * 0.2;
      xp += timeBonus;
    }
    const totalXp = Math.round(xp);
    return new Response(
      JSON.stringify({
        success: true,
        isCorrect: true,
        feedback,
        correctAnswer,
        xpEarned: totalXp,
        xpBreakdown: {
          base: baseXp,
          hintPenalty: -Math.round(hintPenalty),
          timePenalty: 0,
          bonuses: Math.round(timeBonus),
          total: totalXp
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in evaluate-answer:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(onRequestPost3, "onRequestPost");
async function onRequestGet3(context) {
  return new Response(
    JSON.stringify({
      endpoint: "/api/evaluate-answer",
      method: "POST",
      description: "Evaluates user answer and calculates XP",
      requiredFields: ["questionData", "userAnswer", "hintsUsed", "timeSpent"]
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
__name(onRequestGet3, "onRequestGet");

// api/generate-custom-hint.js
async function onRequestPost4(context) {
  try {
    const body = await context.request.json();
    const { apiKey, userId, questionData, userQuestion, previousHints, userContext } = body;
    if (!apiKey || !questionData || !userQuestion) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const hintsUsedText = previousHints && previousHints.length > 0 ? previousHints.map((h, i) => `Hinweis ${i + 1}: ${h}`).join("\n") : "Keine Hinweise bisher verwendet";
    const prompt = `Du bist ein geduldiger und hilfreicher Mathematik-Tutor.

Der Sch\xFCler bearbeitet folgende Aufgabe:

AUFGABE:
${questionData.question}

${questionData.type === "multiple-choice" ? `ANTWORTM\xD6GLICHKEITEN:
${questionData.options.map((opt) => `${opt.id}) ${opt.text}`).join("\n")}` : ""}

${questionData.type === "step-by-step" ? `SCHRITTE:
${questionData.steps.map((s) => `Schritt ${s.stepNumber}: ${s.instruction}`).join("\n")}` : ""}

BISHERIGE HINWEISE (bereits verwendet):
${hintsUsedText}

DER SCH\xDCLER FRAGT JETZT:
"${userQuestion}"

DEINE AUFGABE:
Gib einen hilfreichen, personalisierten Hinweis, der:
1. Direkt auf die Frage des Sch\xFClers eingeht
2. Verst\xE4ndlich und ermutigend ist
3. NICHT die komplette L\xF6sung verr\xE4t
4. Den Sch\xFCler zum eigenst\xE4ndigen Denken anregt
5. Maximal 3-4 S\xE4tze lang ist

WICHTIG:
- Sei geduldig und ermutigend
- Nutze einfache Sprache
- Vermeide es, die L\xF6sung direkt zu nennen
- Gib konkrete Denkanst\xF6\xDFe

Antworte NUR mit dem Hinweis-Text (keine zus\xE4tzlichen Erkl\xE4rungen oder Formatierungen):`;
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        temperature: 0.8,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });
    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.json();
      return new Response(
        JSON.stringify({
          success: false,
          error: "Anthropic API error",
          details: error
        }),
        { status: anthropicResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }
    const anthropicData = await anthropicResponse.json();
    const customHint = anthropicData.content[0].text.trim();
    return new Response(
      JSON.stringify({
        success: true,
        customHint
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-custom-hint:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(onRequestPost4, "onRequestPost");
async function onRequestGet4(context) {
  return new Response(
    JSON.stringify({
      endpoint: "/api/generate-custom-hint",
      method: "POST",
      description: "Generates personalized hint based on user question",
      requiredFields: ["apiKey", "questionData", "userQuestion", "previousHints"]
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
__name(onRequestGet4, "onRequestGet");

// api/generate-geogebra.js
async function onRequestPost5(context) {
  try {
    const body = await context.request.json();
    const { apiKey, userId, questionData, selectedModel } = body;
    if (!apiKey || !userId || !questionData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const model = selectedModel || "claude-sonnet-4-5-20250929";
    const prompt = `Du bist ein Mathematiklehrer mit Expertise in GeoGebra-Visualisierungen.

AUFGABE:
Erstelle eine interaktive GeoGebra-Visualisierung f\xFCr folgende Mathematik-Aufgabe:

FRAGE:
${questionData.question}

THEMA: ${questionData.topic} > ${questionData.subtopic}
SCHWIERIGKEIT: ${questionData.difficulty}/5

${questionData.geogebra?.commands ? `VORHANDENE GEOGEBRA-BEFEHLE:
${questionData.geogebra.commands.join("\n")}` : ""}

ANFORDERUNGEN:

1. GEOGEBRA-BEFEHLE:
   - Erstelle eine Liste von GeoGebra-Befehlen (GeoGebra Classic Syntax)
   - Die Befehle sollen die mathematischen Konzepte der Aufgabe visualisieren
   - Nutze klare Variablennamen (z.B. f, g, A, B)
   - Bei Funktionen: Zeige relevante Merkmale (Nullstellen, Extrempunkte, etc.)
   - Bei Vektoren/Geometrie: Nutze 2D oder 3D je nach Bedarf
   - Verwende Farben f\xFCr bessere Unterscheidung: SetColor[objekt, "red"]
   - Beschrifte wichtige Punkte: Text["Name", punkt]

2. ERKL\xC4RUNG:
   - Erkl\xE4re in 2-4 S\xE4tzen, was die Visualisierung zeigt
   - Beschreibe, wie die Visualisierung beim L\xF6sen der Aufgabe hilft
   - Nutze eine sch\xFClerfreundliche Sprache
   - Hebe wichtige visuelle Merkmale hervor

3. INTERAKTIVE ELEMENTE (optional):
   - Wenn sinnvoll, erstelle Slider f\xFCr Parameter: a = Slider[-5, 5, 0.1]
   - Zeige dynamische Zusammenh\xE4nge

BEISPIELE:

F\xFCr Ableitungen:
{
  "commands": [
    "f(x) = x^3 - 3*x^2 + 2",
    "SetColor[f, "blue"]",
    "f'(x)",
    "SetColor[f', "red"]",
    "E = Extremum[f]",
    "SetPointStyle[E, 3]",
    "SetPointSize[E, 4]"
  ],
  "explanation": "Die Visualisierung zeigt die Funktion f(x) in Blau und ihre Ableitung f'(x) in Rot. Die Extrempunkte (Maximum und Minimum) sind als gr\xF6\xDFere Punkte markiert. Du kannst sehen, dass f'(x) = 0 genau an den Extremstellen ist.",
  "interactionTips": "Zoome in den Bereich um die Extrempunkte, um die Zusammenh\xE4nge besser zu erkennen."
}

F\xFCr Vektoren:
{
  "commands": [
    "A = (1, 2)",
    "B = (4, 5)",
    "v = Vector[A, B]",
    "SetColor[v, "green"]",
    "Text["Vektor v", B + (0.5, 0.5)]"
  ],
  "explanation": "Die Visualisierung zeigt den Vektor v (gr\xFCn) vom Punkt A zum Punkt B. Die Koordinaten beider Punkte sind im Koordinatensystem sichtbar.",
  "interactionTips": "Du kannst die Punkte A und B verschieben, um zu sehen, wie sich der Vektor \xE4ndert."
}

Gib deine Antwort als JSON zur\xFCck (NUR das JSON, keine weiteren Erkl\xE4rungen):

{
  "commands": ["GeoGebra Befehl 1", "GeoGebra Befehl 2", ...],
  "explanation": "Erkl\xE4rung was die Visualisierung zeigt",
  "interactionTips": "Optionale Tipps zur Interaktion (oder null wenn nicht n\xF6tig)"
}

WICHTIG: Die Befehle m\xFCssen f\xFCr GeoGebra Classic 6 kompatibel sein!`;
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: 2e3,
        temperature: 0.5,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });
    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json();
      return new Response(
        JSON.stringify({
          success: false,
          error: "Anthropic API error",
          details: errorData
        }),
        { status: anthropicResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }
    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content[0].text;
    let geogebraData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        geogebraData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to parse GeoGebra response",
          rawResponse: responseText
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        geogebra: {
          commands: geogebraData.commands,
          explanation: geogebraData.explanation,
          interactionTips: geogebraData.interactionTips || null
        },
        usage: {
          inputTokens: anthropicData.usage.input_tokens,
          outputTokens: anthropicData.usage.output_tokens
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating GeoGebra visualization:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(onRequestPost5, "onRequestPost");

// ../data/prompts/generate-questions.js
var generate_questions_default = {
  version: "1.0",
  description: "System prompt for generating math questions for Baden-W\xFCrttemberg Oberstufe",
  prompt: `Du bist ein erfahrener Mathematiklehrer f\xFCr die Oberstufe in Baden-W\xFCrttemberg.

AUFGABE:
Generiere 20 hochwertige \xDCbungsaufgaben basierend auf folgenden Themen:

THEMEN:
{{TOPICS_LIST}}

NUTZERKONTEXT:
- Klassenstufe: {{GRADE_LEVEL}}
- Kurstyp: {{COURSE_TYPE}}
{{STRUGGLING_TOPICS}}
{{MEMORIES}}

{{AUTO_MODE}}

WICHTIGE ANFORDERUNGEN:

1. FRAGETYPEN (Mix):
   - 70% Multiple-Choice (4 Antwortoptionen, genau 1 korrekt)
   - 30% Step-by-Step (2-4 Schritte, numerische oder algebraische Antworten)

2. SCHWIERIGKEITSVERTEILUNG:
   - 20% Schwierigkeit 1-2 (AFB I: Reproduktion, einfache Anwendung)
   - 50% Schwierigkeit 3 (AFB II: Zusammenh\xE4nge herstellen, Standardverfahren anwenden)
   - 30% Schwierigkeit 4-5 (AFB III: Transfer, komplexe Probleml\xF6sung)

3. HINWEISE (f\xFCr jede Frage 3 Stufen):
   - Hint 1: Sanfter Denkansto\xDF, weist auf relevantes Konzept hin (keine L\xF6sung!)
   - Hint 2: Konkreter Tipp zur Methode/Formel, aber keine vollst\xE4ndige Rechnung
   - Hint 3: Detaillierter L\xF6sungsweg, aber Sch\xFCler muss selbst die finalen Schritte ausf\xFChren

4. GEOGEBRA-VISUALISIERUNG (automatische Bewertung):
   - F\xFCr JEDE Frage: Entscheide, ob eine visuelle Darstellung hilfreich ist
   - Setze hasGeoGebraVisualization auf true WENN:
     * Bei Analysis: Funktionsgraphen, Ableitungen, Integrale, Kurvendiskussion
     * Bei Geometrie: Vektoren, Ebenen, Geraden, geometrische Figuren
     * Bei Stochastik: Verteilungen, Wahrscheinlichkeitsfl\xE4chen
     * Generell: Wenn grafische Darstellung das Verst\xE4ndnis f\xF6rdert
   - Setze hasGeoGebraVisualization auf false WENN:
     * Reine Rechenaufgaben (z.B. "Berechne 5x + 3")
     * Gleichungen l\xF6sen ohne geometrischen Kontext
     * Reine algebraische Umformungen
   - Wenn hasGeoGebraVisualization = true, gib GeoGebra-Befehle an:
     * Analysis-Beispiele: ["f(x) = x^2 + 2*x - 3", "Derivative(f)", "Integral(f, -2, 3)"]
     * Vektoren-Beispiele: ["A = (1, 2, 3)", "B = (4, 5, 6)", "Vector(A, B)"]
     * Geraden-Beispiele: ["g: X = (1, 2, 3) + t*(2, 1, -1)"]

5. PERSONALISIERUNG:
   - Passe Schwierigkeit an bisherige Performance an
   - Bei Schwierigkeiten: Mehr Unterst\xFCtzung in Hints, einfachere Startfragen
   - Bei guter Performance: Herausfordernde AFB III Fragen
   - Nutze AUTO-Modus Einsch\xE4tzung f\xFCr Detailgrad der Erkl\xE4rungen

6. QUALIT\xC4TSSTANDARDS:
   - Mathematisch korrekt und pr\xE4zise
   - Klare, verst\xE4ndliche Formulierung
   - Realit\xE4tsnahe Kontexte wo m\xF6glich
   - Vielf\xE4ltige Aufgabenstellungen (nicht repetitiv)
   - LaTeX f\xFCr mathematische Notation: z.B. $f(x) = x^2$, $\\frac{1}{2}$, $\\int_0^1 x dx$

Gib deine Antwort als JSON zur\xFCck (NUR das JSON, keine weiteren Erkl\xE4rungen):

{
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "topic": "Analysis",
      "subtopic": "Ableitungen",
      "difficulty": 2,
      "question": "Bestimme die Ableitung von $f(x) = 3x^2 + 2x - 5$.",
      "options": [
        {"id": "A", "text": "$f'(x) = 6x + 2$", "isCorrect": true},
        {"id": "B", "text": "$f'(x) = 6x - 5$", "isCorrect": false},
        {"id": "C", "text": "$f'(x) = 3x + 2$", "isCorrect": false},
        {"id": "D", "text": "$f'(x) = 6x^2 + 2$", "isCorrect": false}
      ],
      "hints": [
        {"level": 1, "text": "Denke an die Potenzregel: $(x^n)' = n \\cdot x^{n-1}$"},
        {"level": 2, "text": "Leite jeden Term einzeln ab: $(3x^2)' = 6x$, $(2x)' = 2$, Konstanten fallen weg"},
        {"level": 3, "text": "L\xF6sung: $f'(x) = 3 \\cdot 2x + 2 = 6x + 2$"}
      ],
      "solution": "A",
      "explanation": "Mit der Potenzregel erhalten wir: $f'(x) = 3 \\cdot 2x^{2-1} + 2 \\cdot 1x^{1-1} - 0 = 6x + 2$",
      "hasGeoGebraVisualization": true,
      "geogebra": {
        "commands": ["f(x) = 3*x^2 + 2*x - 5", "f'(x)"],
        "description": "Zeigt die Funktion f(x) und ihre Ableitung f'(x) im Graphen"
      }
    },
    {
      "id": "q2",
      "type": "step-by-step",
      "topic": "Analysis",
      "subtopic": "Kurvendiskussion",
      "difficulty": 4,
      "question": "Gegeben ist die Funktion $f(x) = x^3 - 3x^2 + 2$. F\xFChre eine vollst\xE4ndige Kurvendiskussion durch.",
      "steps": [
        {
          "stepNumber": 1,
          "instruction": "Bestimme die Nullstellen von $f(x)$. Gib die kleinste Nullstelle an (auf 2 Dezimalstellen gerundet).",
          "expectedAnswer": "-0.73",
          "tolerance": 0.02
        },
        {
          "stepNumber": 2,
          "instruction": "Bestimme die x-Koordinate des lokalen Maximums.",
          "expectedAnswer": "0",
          "tolerance": 0.01
        },
        {
          "stepNumber": 3,
          "instruction": "Bestimme die x-Koordinate des lokalen Minimums.",
          "expectedAnswer": "2",
          "tolerance": 0.01
        }
      ],
      "hints": [
        {"level": 1, "text": "F\xFCr Extremstellen: Setze $f'(x) = 0$ und l\xF6se nach x auf"},
        {"level": 2, "text": "Bilde die Ableitungen: $f'(x) = 3x^2 - 6x$ und $f''(x) = 6x - 6$. Extremstellen bei $x = 0$ und $x = 2$"},
        {"level": 3, "text": "Mit $f''(0) = -6 < 0$ ist $x=0$ ein Maximum. Mit $f''(2) = 6 > 0$ ist $x=2$ ein Minimum. Nullstellen numerisch oder mit Polynomdivision finden."}
      ],
      "solution": "Nullstellen: $x_1 \\approx -0.73$, $x_2 = 1$, $x_3 \\approx 2.73$; Maximum bei $(0, 2)$; Minimum bei $(2, -2)$",
      "explanation": "Durch Ableitung und Nullstellensuche der Ableitung finden wir die Extremstellen. Die zweite Ableitung entscheidet \xFCber Art der Extremstelle.",
      "hasGeoGebraVisualization": true,
      "geogebra": {
        "commands": ["f(x) = x^3 - 3*x^2 + 2", "Derivative(f)", "Extremum(f)"],
        "description": "Visualisiert die kubische Funktion mit Extrempunkten und Ableitung"
      }
    }
  ]
}

WICHTIG: Generiere GENAU 20 Fragen mit dieser Struktur!`,
  placeholders: {
    TOPICS_LIST: "List of topics from learning plan",
    GRADE_LEVEL: "User's grade level (Klasse_11 or Klasse_12)",
    COURSE_TYPE: "Course type (Leistungsfach or Basisfach)",
    STRUGGLING_TOPICS: "Topics user is struggling with",
    MEMORIES: "AI memories about the user",
    AUTO_MODE: "AUTO mode assessment context"
  }
};

// api/generate-questions.js
async function onRequestPost6(context) {
  try {
    const body = await context.request.json();
    const { apiKey, userId, learningPlanItemId, topics, userContext, selectedModel } = body;
    if (!apiKey || !userId || !topics || !userContext) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const model = selectedModel || "claude-sonnet-4-5-20250929";
    const curriculum = bw_oberstufe_themen_default.Klassen_11_12[userContext.courseType];
    const strugglingTopicsText = userContext.recentPerformance?.strugglingTopics?.length > 0 ? `Der Sch\xFCler hat Schwierigkeiten mit: ${userContext.recentPerformance.strugglingTopics.join(", ")}` : "Keine bekannten Schwierigkeiten";
    const autoModeText = userContext.autoModeAssessment ? `AUTO-Modus Einsch\xE4tzung:
- Detailgrad: ${userContext.autoModeAssessment.currentAssessment.detailLevel}% (${userContext.autoModeAssessment.currentAssessment.detailLevel > 60 ? "ausf\xFChrliche" : "kurze"} Erkl\xE4rungen)
- Temperatur: ${userContext.autoModeAssessment.currentAssessment.temperature} (${userContext.autoModeAssessment.currentAssessment.temperature > 0.6 ? "kreativ" : "pr\xE4zise"})
- Hilfestellung: ${userContext.autoModeAssessment.currentAssessment.helpfulness}% (${userContext.autoModeAssessment.currentAssessment.helpfulness > 60 ? "unterst\xFCtzend" : "eigenst\xE4ndig"})

Interne Begr\xFCndung: "${userContext.autoModeAssessment.currentAssessment.reasoning}"` : "AUTO-Modus nicht aktiv - nutze ausgewogene Einstellungen";
    const topicsList = topics.map((t) => `- ${t.leitidee} > ${t.thema} > ${t.unterthema}`).join("\n");
    const memoriesText = userContext.recentMemories?.length > 0 ? `Bekannte Informationen \xFCber den Sch\xFCler:
${userContext.recentMemories.join("\n")}` : "Keine spezifischen Informationen \xFCber Lernverhalten bekannt";
    const prompt = generate_questions_default.prompt.replace("{{TOPICS_LIST}}", topicsList).replace("{{GRADE_LEVEL}}", userContext.gradeLevel).replace("{{COURSE_TYPE}}", userContext.courseType).replace("{{STRUGGLING_TOPICS}}", strugglingTopicsText).replace("{{MEMORIES}}", memoriesText).replace("{{AUTO_MODE}}", autoModeText);
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: 16e3,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });
    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.json();
      return new Response(
        JSON.stringify({
          success: false,
          error: "Anthropic API error",
          details: error
        }),
        { status: anthropicResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }
    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content[0].text;
    let questionsData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0]);
      } else {
        questionsData = JSON.parse(responseText);
      }
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to parse Claude response",
          rawResponse: responseText.substring(0, 1e3)
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const sessionId = `session_${Date.now()}_${userId.substring(0, 8)}`;
    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        learningPlanItemId,
        topics,
        userContext,
        questions: questionsData.questions,
        totalQuestions: questionsData.questions.length
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-questions:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(onRequestPost6, "onRequestPost");
async function onRequestGet5(context) {
  return new Response(
    JSON.stringify({
      endpoint: "/api/generate-questions",
      method: "POST",
      description: "Generates 20 questions with hints and solutions",
      requiredFields: ["apiKey", "userId", "topics", "userContext"]
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
__name(onRequestGet5, "onRequestGet");

// api/get-models.js
async function onRequestPost7(context) {
  try {
    const body = await context.request.json();
    const { apiKey } = body;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "API key is required"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      }
    });
    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.json();
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch models from Anthropic API",
          details: error
        }),
        { status: anthropicResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }
    const modelsData = await anthropicResponse.json();
    const models = modelsData.data.filter((model) => {
      return model.id.includes("claude") && !model.id.includes("opus-4");
    }).map((model) => ({
      id: model.id,
      name: formatModelName(model.id),
      type: getModelType(model.id),
      description: getModelDescription(model.id),
      created: model.created_at
    })).sort((a, b) => b.created - a.created);
    return new Response(
      JSON.stringify({
        success: true,
        models
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-models:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(onRequestPost7, "onRequestPost");
function formatModelName(modelId) {
  if (modelId.includes("sonnet")) {
    const match2 = modelId.match(/claude-sonnet-(\d+)-(\d+)/);
    if (match2) {
      return `Claude Sonnet ${match2[1]}.${match2[2]}`;
    }
    return "Claude Sonnet";
  }
  if (modelId.includes("opus")) {
    const match2 = modelId.match(/claude-opus-(\d+)/);
    if (match2) {
      return `Claude Opus ${match2[1]}`;
    }
    return "Claude Opus";
  }
  if (modelId.includes("haiku")) {
    const match2 = modelId.match(/claude-(\d+)-(\d+)-haiku/);
    if (match2) {
      return `Claude ${match2[1]}.${match2[2]} Haiku`;
    }
    return "Claude Haiku";
  }
  return modelId.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
__name(formatModelName, "formatModelName");
function getModelType(modelId) {
  if (modelId.includes("sonnet")) return "balanced";
  if (modelId.includes("opus")) return "powerful";
  if (modelId.includes("haiku")) return "fast";
  return "standard";
}
__name(getModelType, "getModelType");
function getModelDescription(modelId) {
  if (modelId.includes("sonnet-4-5")) {
    return "Neueste Sonnet-Version mit verbesserter Genauigkeit und Geschwindigkeit";
  }
  if (modelId.includes("sonnet-4")) {
    return "Ausgewogenes Modell f\xFCr komplexe Aufgaben";
  }
  if (modelId.includes("sonnet")) {
    return "Ausgewogen zwischen Leistung und Geschwindigkeit";
  }
  if (modelId.includes("opus")) {
    return "H\xF6chste Genauigkeit und Intelligenz";
  }
  if (modelId.includes("haiku")) {
    return "Schnell und effizient f\xFCr einfache Aufgaben";
  }
  return "Claude Modell";
}
__name(getModelDescription, "getModelDescription");
async function onRequestGet6(context) {
  return new Response(
    JSON.stringify({
      endpoint: "/api/get-models",
      method: "POST",
      description: "Fetches available Claude models",
      requiredFields: ["apiKey"]
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
__name(onRequestGet6, "onRequestGet");

// api/update-auto-mode.js
async function onRequestPost8(context) {
  try {
    const body = await context.request.json();
    const { apiKey, userId, previousAssessment, performanceData } = body;
    if (!apiKey || !performanceData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const previousAssessmentText = previousAssessment ? `VORHERIGE EINSCH\xC4TZUNG:
- Detailgrad: ${previousAssessment.currentAssessment.detailLevel}%
- Temperatur: ${previousAssessment.currentAssessment.temperature}
- Hilfestellung: ${previousAssessment.currentAssessment.helpfulness}%
- Begr\xFCndung: "${previousAssessment.currentAssessment.reasoning}"` : "ERSTE EINSCH\xC4TZUNG (keine vorherige Einsch\xE4tzung vorhanden)";
    const strugglingTopicsText = performanceData.strugglingTopics?.length > 0 ? `Schwierige Themen: ${performanceData.strugglingTopics.join(", ")}` : "Keine spezifischen Schwierigkeiten erkannt";
    const prompt = `Du bist ein KI-Lernsystem, das die optimalen Lerneinstellungen f\xFCr einen Sch\xFCler bestimmt.

${previousAssessmentText}

AKTUELLE PERFORMANCE (letzte ${performanceData.last10Questions?.length || 10} Aufgaben):
- Erfolgsrate: ${Math.round(performanceData.avgAccuracy)}%
- Durchschnittliche Hinweise pro Aufgabe: ${performanceData.avgHintsUsed.toFixed(1)}
- Durchschnittliche Zeit pro Aufgabe: ${Math.round(performanceData.avgTimeSpent)}s
- ${strugglingTopicsText}

DEINE AUFGABE:
Passe die Lernparameter an, um dem Sch\xFCler optimal zu helfen:

PARAMETER:
1. **detailLevel** (0-100): Wie ausf\xFChrlich sollen Erkl\xE4rungen und Hinweise sein?
   - 0-30: Sehr kurz, nur Stichpunkte
   - 31-60: Ausgeglichen, klare Erkl\xE4rungen
   - 61-100: Sehr ausf\xFChrlich, Schritt-f\xFCr-Schritt

2. **temperature** (0-1, Schritte von 0.1): Wie kreativ vs. pr\xE4zise sollen Hinweise sein?
   - 0.0-0.3: Sehr pr\xE4zise, mathematisch streng
   - 0.4-0.6: Ausgeglichen
   - 0.7-1.0: Kreativ, verschiedene Erkl\xE4rungsans\xE4tze

3. **helpfulness** (0-100): Wie viel Unterst\xFCtzung braucht der Sch\xFCler?
   - 0-30: Eigenst\xE4ndig, minimale Hilfe
   - 31-60: Ausgeglichen
   - 61-100: Sehr unterst\xFCtzend, viele Hilfestellungen

ANPASSUNGS-LOGIK (Beispiele):
- Hohe Erfolgsrate (>80%) + wenige Hinweise (< 1.5) \u2192 Weniger Hilfe, fordere Eigenst\xE4ndigkeit
- Niedrige Erfolgsrate (<50%) \u2192 Mehr Details, mehr Unterst\xFCtzung, pr\xE4zisere Hinweise
- Viele Hinweise genutzt (> 2) \u2192 Erh\xF6he helpfulness und detailLevel
- Spezifische Themenschwierigkeiten \u2192 temperature senken f\xFCr pr\xE4zisere Erkl\xE4rungen
- Gute Performance trotz wenig Hilfe \u2192 Fortgeschrittene Herausforderungen

AUSGABE:
Gib deine Einsch\xE4tzung als JSON zur\xFCck (NUR das JSON):
{
  "detailLevel": 65,
  "temperature": 0.5,
  "helpfulness": 70,
  "reasoning": "Sch\xFCler zeigt Fortschritt, aber braucht noch Unterst\xFCtzung bei komplexen Ableitungen. Detailgrad erh\xF6ht, um Sicherheit zu st\xE4rken."
}

WICHTIG:
- Die "reasoning" Begr\xFCndung ist NICHT f\xFCr den Sch\xFCler sichtbar, nur intern
- Maximal 2 S\xE4tze f\xFCr reasoning
- Sei objektiv und datenbasiert`;
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });
    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.json();
      return new Response(
        JSON.stringify({
          success: false,
          error: "Anthropic API error",
          details: error
        }),
        { status: anthropicResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }
    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content[0].text;
    let newAssessment;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        newAssessment = JSON.parse(jsonMatch[0]);
      } else {
        newAssessment = JSON.parse(responseText);
      }
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to parse Claude response",
          rawResponse: responseText
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    newAssessment.detailLevel = Math.max(0, Math.min(100, newAssessment.detailLevel));
    newAssessment.temperature = Math.max(0, Math.min(1, Math.round(newAssessment.temperature * 10) / 10));
    newAssessment.helpfulness = Math.max(0, Math.min(100, newAssessment.helpfulness));
    return new Response(
      JSON.stringify({
        success: true,
        newAssessment
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in update-auto-mode:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(onRequestPost8, "onRequestPost");
async function onRequestGet7(context) {
  return new Response(
    JSON.stringify({
      endpoint: "/api/update-auto-mode",
      method: "POST",
      description: "Updates AUTO mode assessment based on performance",
      requiredFields: ["apiKey", "performanceData"]
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
__name(onRequestGet7, "onRequestGet");

// ../.wrangler/tmp/pages-fwHAtO/functionsRoutes-0.07617303037553991.mjs
var routes = [
  {
    routePath: "/api/analyze-image",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/analyze-image",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/evaluate-answer",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/evaluate-answer",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/generate-custom-hint",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/generate-custom-hint",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/generate-geogebra",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/generate-questions",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/generate-questions",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/get-models",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/get-models",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/update-auto-mode",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/update-auto-mode",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-xdaIZr/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-xdaIZr/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.9853495308391869.mjs.map
