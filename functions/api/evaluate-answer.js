// Cloudflare Pages Function: Answer Evaluation
// Evaluates user answers and calculates XP

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const { apiKey, userId, questionId, questionData, userAnswer, hintsUsed, timeSpent, skipped, correctStreak } = body

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

    // Evaluate based on question type
    if (questionData.type === 'multiple-choice') {
      correctAnswer = questionData.options.find(opt => opt.isCorrect)?.id
      isCorrect = userAnswer === correctAnswer

      if (isCorrect) {
        feedback = `Richtig! ${questionData.explanation}`
      } else {
        const userOption = questionData.options.find(opt => opt.id === userAnswer)
        feedback = `Leider falsch. Du hast ${userOption?.text || 'keine Antwort'} gewählt. Die richtige Antwort ist ${correctAnswer}. ${questionData.explanation}`
      }

    } else if (questionData.type === 'step-by-step') {
      // Evaluate each step
      const stepResults = questionData.steps.map((step, index) => {
        const userStepAnswer = userAnswer[index]
        const expected = parseFloat(step.expectedAnswer)
        const actual = parseFloat(userStepAnswer)
        const tolerance = step.tolerance || 0.01

        const stepCorrect = Math.abs(expected - actual) <= tolerance

        return {
          stepNumber: step.stepNumber,
          correct: stepCorrect,
          expected: step.expectedAnswer,
          actual: userStepAnswer
        }
      })

      isCorrect = stepResults.every(r => r.correct)
      correctAnswer = questionData.steps.map(s => s.expectedAnswer)

      if (isCorrect) {
        feedback = `Alle Schritte korrekt! ${questionData.explanation}`
      } else {
        const wrongSteps = stepResults.filter(r => !r.correct).map(r => r.stepNumber)
        feedback = `Nicht alle Schritte waren korrekt. Fehler in Schritt(en): ${wrongSteps.join(', ')}. ${questionData.explanation}`
      }
    }

    // Calculate XP
    const BASE_XP = {
      1: 10, 2: 15, 3: 20, 4: 30, 5: 50
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
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // If wrong, no XP
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
    const expectedTime = questionData.difficulty * 60
    if (timeSpent && timeSpent < expectedTime * 0.5) {
      timeBonus = baseXp * 0.2 // +20% bonus
      xp += timeBonus
    }

    // Streak bonus (5+ correct answers in a row)
    let streakBonus = 0
    if (correctStreak && correctStreak >= 5) {
      streakBonus = xp * 0.5 // +50% bonus
      xp += streakBonus
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
          total: totalXp
        }
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
      description: 'Evaluates user answer and calculates XP',
      requiredFields: ['questionData', 'userAnswer', 'hintsUsed', 'timeSpent']
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
