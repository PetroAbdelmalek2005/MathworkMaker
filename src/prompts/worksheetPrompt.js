export function buildPrompt(grade, topic, difficulty) {
  return {
    system: `You are a math teacher generating worksheets for students.
Return ONLY a valid JSON object — no markdown, no code fences, no explanation, nothing else before or after the JSON.

Formatting rules (strictly follow):
- "question": a minimal action word followed by a LaTeX expression. Example: "Simplify $\\dfrac{12}{16}$." or "Solve $3x + 5 = 14$."
- "answer": a pure LaTeX expression only — no words. Example: "$\\dfrac{3}{4}$" or "$x = 3$"
- "explanation": a LaTeX derivation showing each step. Use $$…$$ for displayed equations. Example: "$$3x+5=14 \\Rightarrow 3x=9 \\Rightarrow x=3$$"
- "example_problem" and "example_solution": follow the same rules as question and answer.
- "lesson.concept": 2–3 readable sentences for a Grade ${grade} student; wrap every number or expression in $…$.

Every question must have a clear LaTeX answer suitable for a grade ${grade} student.`,

    user: `Generate a math worksheet for Grade ${grade}, Topic: "${topic}", Difficulty: ${difficulty}.

The JSON must exactly follow this structure:
{
  "topic": "${topic}",
  "grade": ${grade},
  "difficulty": "${difficulty.toLowerCase()}",
  "lesson": {
    "concept": "2-3 sentences explaining the concept for a Grade ${grade} student, with all numbers and expressions in $...$.",
    "example_problem": "Minimal action word + LaTeX. E.g. \\"Evaluate $\\\\dfrac{2}{3} + \\\\dfrac{1}{4}$.\\"",
    "example_solution": "Pure LaTeX answer. E.g. \\"$\\\\dfrac{11}{12}$\\""
  },
  "questions": [
    {
      "id": 1,
      "question": "Minimal action word + LaTeX expression.",
      "answer": "Pure LaTeX expression only.",
      "explanation": "LaTeX step-by-step derivation using $$...$$ for display math."
    }
  ]
}

Generate exactly 10 questions. Questions should be varied and age-appropriate for Grade ${grade}.
Make difficulty "${difficulty.toLowerCase()}": ${
  difficulty === 'Easy'
    ? 'straightforward, single-step problems'
    : difficulty === 'Medium'
    ? 'two-step problems requiring moderate reasoning'
    : 'multi-step problems that challenge strong students'
}.`,
  };
}
