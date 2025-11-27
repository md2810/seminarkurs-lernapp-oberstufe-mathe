/**
 * Cloudflare Pages Function: Answer Evaluation
 * Evaluates user answers with semantic math comparison and misconception detection
 *
 * Phase 1 Upgrade: Semantic Math Evaluation
 * - Recognizes algebraic equivalence (x+1 = 1+x)
 * - Handles numeric equivalence (1/2 = 0.5)
 * - Detects common misconceptions
 */

// ============================================================================
// SEMANTIC MATH EVALUATION ENGINE
// ============================================================================

/**
 * Normalize a mathematical expression for comparison
 * Handles fractions, decimals, and basic algebraic expressions
 */
function normalizeExpression(expr) {
  if (expr === null || expr === undefined) return ''

  let normalized = String(expr).trim().toLowerCase()

  // Remove unnecessary spaces
  normalized = normalized.replace(/\s+/g, '')

  // Normalize common symbols
  normalized = normalized
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/·/g, '*')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√/g, 'sqrt')
    .replace(/π/g, 'pi')

  // Remove leading '+' signs
  normalized = normalized.replace(/^\+/, '')

  // Normalize implicit multiplication (2x -> 2*x)
  normalized = normalized.replace(/(\d)([a-z])/gi, '$1*$2')

  return normalized
}

/**
 * Evaluate a mathematical expression to a numeric value
 * Returns null if expression cannot be evaluated numerically
 */
function evaluateToNumber(expr) {
  try {
    const normalized = normalizeExpression(expr)

    // Handle common mathematical constants
    let evalExpr = normalized
      .replace(/pi/g, String(Math.PI))
      .replace(/e(?![a-z])/g, String(Math.E))
      .replace(/sqrt\(([^)]+)\)/g, (_, inner) => `Math.sqrt(${inner})`)
      .replace(/\^/g, '**')

    // Handle fractions like "1/2"
    if (/^-?\d+\/\d+$/.test(evalExpr)) {
      const [num, denom] = evalExpr.split('/')
      return parseFloat(num) / parseFloat(denom)
    }

    // Safe evaluation for simple numeric expressions
    if (/^[0-9+\-*/().eE\s]+$/.test(evalExpr) || /Math\.\w+/.test(evalExpr)) {
      // Use Function constructor for safe evaluation
      const result = new Function(`return ${evalExpr}`)()
      if (typeof result === 'number' && !isNaN(result)) {
        return result
      }
    }

    // Try direct parsing
    const direct = parseFloat(normalized)
    if (!isNaN(direct)) return direct

    return null
  } catch {
    return null
  }
}

/**
 * Parse algebraic expression into coefficient-variable terms
 * Returns a map of {variable: coefficient}
 */
function parseAlgebraic(expr) {
  const normalized = normalizeExpression(expr)
  const terms = {}

  // Split by + and - while keeping the signs
  const parts = normalized.split(/(?=[+-])/)

  for (const part of parts) {
    if (!part) continue

    // Match coefficient and variable(s)
    const match = part.match(/^([+-]?\d*\.?\d*)\*?([a-z]*)(\^?\d*)?$/i)
    if (match) {
      let [, coef, variable, power] = match
      coef = coef === '' || coef === '+' ? 1 : coef === '-' ? -1 : parseFloat(coef)
      variable = variable || 'const'
      power = power ? power.replace('^', '') : '1'

      const key = variable === 'const' ? 'const' : `${variable}^${power}`
      terms[key] = (terms[key] || 0) + coef
    }
  }

  return terms
}

/**
 * Check if two algebraic expressions are equivalent
 */
function checkAlgebraicEquivalence(expr1, expr2) {
  const terms1 = parseAlgebraic(expr1)
  const terms2 = parseAlgebraic(expr2)

  // Get all unique keys
  const allKeys = new Set([...Object.keys(terms1), ...Object.keys(terms2)])

  // Compare each term
  for (const key of allKeys) {
    const val1 = terms1[key] || 0
    const val2 = terms2[key] || 0
    if (Math.abs(val1 - val2) > 0.0001) {
      return false
    }
  }

  return true
}

/**
 * Main equivalence checker combining numeric and algebraic methods
 */
function checkEquivalence(userAnswer, expectedAnswer, options = {}) {
  const { tolerance = 0.0001, type = 'auto' } = options

  // Normalize both answers
  const userNorm = normalizeExpression(userAnswer)
  const expectedNorm = normalizeExpression(expectedAnswer)

  // Direct string match after normalization
  if (userNorm === expectedNorm) {
    return { isEquivalent: true, method: 'exact' }
  }

  // Try numeric evaluation
  const userNum = evaluateToNumber(userAnswer)
  const expectedNum = evaluateToNumber(expectedAnswer)

  if (userNum !== null && expectedNum !== null) {
    if (Math.abs(userNum - expectedNum) <= tolerance) {
      return { isEquivalent: true, method: 'numeric', userValue: userNum, expectedValue: expectedNum }
    }
    // Close but not within tolerance
    if (Math.abs(userNum - expectedNum) <= tolerance * 100) {
      return { isEquivalent: false, method: 'numeric', isClose: true, userValue: userNum, expectedValue: expectedNum }
    }
  }

  // Try algebraic equivalence for expressions with variables
  if (/[a-z]/i.test(userNorm) && /[a-z]/i.test(expectedNorm)) {
    if (checkAlgebraicEquivalence(userNorm, expectedNorm)) {
      return { isEquivalent: true, method: 'algebraic' }
    }
  }

  return { isEquivalent: false, method: 'none' }
}

// ============================================================================
// MISCONCEPTION DETECTOR
// ============================================================================

/**
 * Common mathematical misconceptions and their detection patterns
 */
const MISCONCEPTIONS = [
  {
    id: 'sign_error',
    name: 'Vorzeichenfehler',
    description: 'Das Vorzeichen wurde verwechselt',
    check: (user, expected) => {
      const userNum = evaluateToNumber(user)
      const expectedNum = evaluateToNumber(expected)
      if (userNum !== null && expectedNum !== null) {
        return Math.abs(userNum + expectedNum) < 0.0001
      }
      return false
    },
    hint: 'Überprüfe die Vorzeichen in deiner Rechnung.'
  },
  {
    id: 'factor_error',
    name: 'Faktor vergessen',
    description: 'Ein Faktor wurde vergessen oder hinzugefügt',
    check: (user, expected) => {
      const userNum = evaluateToNumber(user)
      const expectedNum = evaluateToNumber(expected)
      if (userNum !== null && expectedNum !== null && expectedNum !== 0) {
        const ratio = userNum / expectedNum
        return [2, 0.5, 10, 0.1, Math.PI, 1/Math.PI].some(
          factor => Math.abs(ratio - factor) < 0.001
        )
      }
      return false
    },
    hint: 'Überprüfe, ob du alle Faktoren berücksichtigt hast.'
  },
  {
    id: 'fraction_flip',
    name: 'Bruch umgekehrt',
    description: 'Zähler und Nenner wurden vertauscht',
    check: (user, expected) => {
      const userNum = evaluateToNumber(user)
      const expectedNum = evaluateToNumber(expected)
      if (userNum !== null && expectedNum !== null && userNum !== 0) {
        return Math.abs(userNum * expectedNum - 1) < 0.0001
      }
      return false
    },
    hint: 'Überprüfe, ob Zähler und Nenner in der richtigen Position sind.'
  },
  {
    id: 'order_of_operations',
    name: 'Rechenreihenfolge',
    description: 'Punkt vor Strich nicht beachtet',
    check: (user, expected) => {
      // This is hard to detect generically, check for common patterns
      return false
    },
    hint: 'Denke an die Rechenreihenfolge: Klammern, Potenzen, Punkt vor Strich.'
  },
  {
    id: 'power_error',
    name: 'Potenzfehler',
    description: 'Fehler beim Potenzieren',
    check: (user, expected) => {
      const userNum = evaluateToNumber(user)
      const expectedNum = evaluateToNumber(expected)
      if (userNum !== null && expectedNum !== null && expectedNum > 0) {
        // Check if user squared instead of not, or vice versa
        return Math.abs(userNum - Math.sqrt(expectedNum)) < 0.001 ||
               Math.abs(userNum - expectedNum * expectedNum) < 0.001
      }
      return false
    },
    hint: 'Überprüfe die Potenz- und Wurzeloperationen.'
  },
  {
    id: 'decimal_error',
    name: 'Kommafehler',
    description: 'Das Dezimalkomma wurde falsch gesetzt',
    check: (user, expected) => {
      const userNum = evaluateToNumber(user)
      const expectedNum = evaluateToNumber(expected)
      if (userNum !== null && expectedNum !== null && expectedNum !== 0) {
        const ratio = userNum / expectedNum
        return [10, 100, 1000, 0.1, 0.01, 0.001].some(
          factor => Math.abs(ratio - factor) < 0.0001
        )
      }
      return false
    },
    hint: 'Überprüfe die Position des Dezimalkommas.'
  },
  {
    id: 'unit_conversion',
    name: 'Einheitenfehler',
    description: 'Einheiten wurden nicht korrekt umgerechnet',
    check: (user, expected) => {
      const userNum = evaluateToNumber(user)
      const expectedNum = evaluateToNumber(expected)
      if (userNum !== null && expectedNum !== null && expectedNum !== 0) {
        const ratio = userNum / expectedNum
        // Common unit conversion factors
        return [60, 1/60, 3600, 1/3600, 1000, 0.001, 100, 0.01].some(
          factor => Math.abs(ratio - factor) < 0.0001
        )
      }
      return false
    },
    hint: 'Überprüfe, ob du alle Einheiten korrekt umgerechnet hast.'
  }
]

/**
 * Detect misconceptions in the user's answer
 */
function detectMisconceptions(userAnswer, expectedAnswer) {
  const detected = []

  for (const misconception of MISCONCEPTIONS) {
    try {
      if (misconception.check(userAnswer, expectedAnswer)) {
        detected.push({
          id: misconception.id,
          name: misconception.name,
          description: misconception.description,
          hint: misconception.hint
        })
      }
    } catch {
      // Ignore check errors
    }
  }

  return detected
}

// ============================================================================
// MAIN EVALUATION HANDLER
// ============================================================================

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const {
      apiKey,
      userId,
      questionId,
      questionData,
      userAnswer,
      hintsUsed,
      timeSpent,
      skipped,
      correctStreak,
      streakFreezeAvailable // Phase 4: Streak Freeze support
    } = body

    // Validate required fields
    if (!questionData || userAnswer === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let isCorrect = false
    let correctAnswer = null
    let feedback = ''
    let equivalenceResult = null
    let misconceptions = []

    // Evaluate based on question type
    if (questionData.type === 'multiple-choice') {
      correctAnswer = questionData.options.find(opt => opt.isCorrect)?.id
      isCorrect = userAnswer === correctAnswer

      if (isCorrect) {
        feedback = `Richtig! ${questionData.explanation || ''}`
      } else {
        const userOption = questionData.options.find(opt => opt.id === userAnswer)
        feedback = `Leider falsch. Du hast "${userOption?.text || 'keine Antwort'}" gewählt. ${questionData.explanation || ''}`
      }

    } else if (questionData.type === 'step-by-step') {
      // Evaluate each step with semantic comparison
      const stepResults = questionData.steps.map((step, index) => {
        const userStepAnswer = userAnswer[index]
        const expected = step.expectedAnswer
        const tolerance = step.tolerance || 0.01

        // Use semantic equivalence check
        const result = checkEquivalence(userStepAnswer, expected, { tolerance })

        // Detect misconceptions for wrong answers
        let stepMisconceptions = []
        if (!result.isEquivalent) {
          stepMisconceptions = detectMisconceptions(userStepAnswer, expected)
        }

        return {
          stepNumber: step.stepNumber,
          correct: result.isEquivalent,
          expected: expected,
          actual: userStepAnswer,
          equivalenceMethod: result.method,
          isClose: result.isClose || false,
          misconceptions: stepMisconceptions
        }
      })

      isCorrect = stepResults.every(r => r.correct)
      correctAnswer = questionData.steps.map(s => s.expectedAnswer)

      // Collect all misconceptions
      misconceptions = stepResults.flatMap(r => r.misconceptions)

      if (isCorrect) {
        feedback = `Alle Schritte korrekt! ${questionData.explanation || ''}`
      } else {
        const wrongSteps = stepResults.filter(r => !r.correct)
        const wrongStepNumbers = wrongSteps.map(r => r.stepNumber)

        // Build detailed feedback
        let detailedFeedback = `Nicht alle Schritte waren korrekt. Fehler in Schritt(en): ${wrongStepNumbers.join(', ')}. `

        // Add misconception hints
        if (misconceptions.length > 0) {
          const uniqueMisconceptions = [...new Map(misconceptions.map(m => [m.id, m])).values()]
          detailedFeedback += '\n\nMögliche Fehlerquellen:\n'
          uniqueMisconceptions.forEach(m => {
            detailedFeedback += `• ${m.name}: ${m.hint}\n`
          })
        }

        // Add "close" feedback
        const closeSteps = wrongSteps.filter(r => r.isClose)
        if (closeSteps.length > 0) {
          detailedFeedback += `\nBei Schritt ${closeSteps.map(r => r.stepNumber).join(', ')} warst du nahe dran!`
        }

        detailedFeedback += `\n\n${questionData.explanation || ''}`
        feedback = detailedFeedback
      }

      equivalenceResult = stepResults

    } else if (questionData.type === 'free-form' || questionData.type === 'numeric') {
      // Free-form or numeric answer with semantic evaluation
      const expected = questionData.correctAnswer || questionData.expectedAnswer
      const tolerance = questionData.tolerance || 0.01

      const result = checkEquivalence(userAnswer, expected, { tolerance })
      isCorrect = result.isEquivalent
      correctAnswer = expected
      equivalenceResult = result

      if (!isCorrect) {
        misconceptions = detectMisconceptions(userAnswer, expected)
      }

      if (isCorrect) {
        feedback = `Richtig! ${questionData.explanation || ''}`
        if (result.method === 'algebraic') {
          feedback = `Richtig! Deine Antwort ist algebraisch äquivalent. ${questionData.explanation || ''}`
        }
      } else {
        feedback = `Leider falsch. Die richtige Antwort ist ${expected}. `

        if (result.isClose) {
          feedback += `Du warst sehr nahe dran! `
        }

        if (misconceptions.length > 0) {
          feedback += '\n\nMögliche Fehlerquellen:\n'
          misconceptions.forEach(m => {
            feedback += `• ${m.name}: ${m.hint}\n`
          })
        }

        feedback += `\n${questionData.explanation || ''}`
      }
    }

    // Calculate XP
    const BASE_XP = {
      1: 10, 2: 15, 3: 20, 4: 30, 5: 50,
      6: 60, 7: 75, 8: 90, 9: 110, 10: 130
    }

    let baseXp = BASE_XP[questionData.difficulty] || 20

    // If skipped
    if (skipped) {
      return new Response(
        JSON.stringify({
          success: true,
          isCorrect: false,
          feedback: 'Frage übersprungen',
          correctAnswer,
          xpEarned: 0,
          xpBreakdown: {
            base: baseXp,
            hintPenalty: -baseXp,
            timePenalty: 0,
            bonuses: 0,
            total: 0
          },
          misconceptions: [],
          equivalenceResult: null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // If wrong, no XP but provide misconception feedback
    if (!isCorrect) {
      // Phase 4: Check for streak freeze
      let streakFrozen = false
      if (streakFreezeAvailable && correctStreak >= 5) {
        streakFrozen = true
        feedback += '\n\n❄️ Dein Streak wurde durch ein Streak-Freeze geschützt!'
      }

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
          },
          misconceptions,
          equivalenceResult,
          streakFrozen // Phase 4: Indicate if streak was preserved
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Calculate XP for correct answer
    const HINT_PENALTY_MULTIPLIER = {
      0: 1.0,   // 100%
      1: 0.85,  // 85%
      2: 0.65,  // 65%
      3: 0.40   // 40%
    }

    let xp = baseXp
    const hintMultiplier = HINT_PENALTY_MULTIPLIER[Math.min(hintsUsed || 0, 3)]
    const hintPenalty = baseXp * (1 - hintMultiplier)
    xp *= hintMultiplier

    // Time bonus (if very fast - expected time ~60s per difficulty level)
    let timeBonus = 0
    const expectedTime = (questionData.difficulty || 5) * 60
    if (timeSpent && timeSpent < expectedTime * 0.5) {
      timeBonus = baseXp * 0.2 // +20% bonus
      xp += timeBonus
    }

    // Streak bonus (5+ correct answers in a row)
    let streakBonus = 0
    if (correctStreak && correctStreak >= 5) {
      streakBonus = xp * 0.5 // +50% bonus
      xp += streakBonus
    } else if (correctStreak && correctStreak >= 3) {
      streakBonus = xp * 0.25 // +25% bonus for 3+ streak
      xp += streakBonus
    }

    // Bonus for using semantic equivalence (shows mathematical understanding)
    let equivalenceBonus = 0
    if (equivalenceResult && equivalenceResult.method === 'algebraic') {
      equivalenceBonus = baseXp * 0.1 // +10% for algebraic answer
      xp += equivalenceBonus
    }

    const totalXp = Math.round(xp)

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
          timeBonus: Math.round(timeBonus),
          streakBonus: Math.round(streakBonus),
          equivalenceBonus: Math.round(equivalenceBonus),
          total: totalXp
        },
        misconceptions: [],
        equivalenceResult
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in evaluate-answer:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server error',
        message: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function onRequestGet(context) {
  return new Response(
    JSON.stringify({
      endpoint: '/api/evaluate-answer',
      method: 'POST',
      description: 'Evaluates user answer with semantic math comparison and misconception detection',
      requiredFields: ['questionData', 'userAnswer'],
      optionalFields: ['hintsUsed', 'timeSpent', 'skipped', 'correctStreak', 'streakFreezeAvailable'],
      features: [
        'Semantic math equivalence (x+1 = 1+x)',
        'Numeric equivalence (1/2 = 0.5)',
        'Misconception detection',
        'XP calculation with bonuses',
        'Streak freeze support'
      ]
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
