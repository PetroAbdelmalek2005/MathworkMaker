export function buildPrompt(grade, topic, difficulty) {
  return {
    system: `You are a math teacher generating worksheets for students.
Return ONLY a valid JSON object — no markdown, no code fences, no explanation, nothing else before or after the JSON.
Use LaTeX syntax for all math expressions: inline math uses single dollar signs like $\\frac{3}{4}$ and $x^2$.
Every question must have a clear numerical or expression answer suitable for a grade ${grade} student.`,

    user: `Generate a math worksheet for Grade ${grade}, Topic: "${topic}", Difficulty: ${difficulty}.

The JSON must exactly follow this structure:
{
  "topic": "${topic}",
  "grade": ${grade},
  "difficulty": "${difficulty.toLowerCase()}",
  "lesson": {
    "concept": "A 2-3 sentence explanation of the key concept, written for a Grade ${grade} student.",
    "example_problem": "One example problem using LaTeX math syntax",
    "example_solution": "Step-by-step solution to the example, using LaTeX math syntax"
  },
  "questions": [
    {
      "id": 1,
      "question": "The question text with LaTeX math where needed",
      "answer": "The exact answer with LaTeX math where needed",
      "explanation": "Brief explanation of how to solve it"
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
