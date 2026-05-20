import { buildPrompt } from '../src/prompts/worksheetPrompt.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { grade, topic, difficulty } = req.body;

  if (!grade || !topic || !difficulty) {
    return res.status(400).json({ error: 'Missing required fields: grade, topic, difficulty' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const { system, user } = buildPrompt(grade, topic, difficulty);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ parts: [{ text: user }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${err}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text.trim();
      const parsed = JSON.parse(text);

      return res.status(200).json(parsed);
    } catch (err) {
      if (attempt === 1) {
        console.error('Failed after 2 attempts:', err);
        return res.status(500).json({ error: err.message || 'Failed to generate worksheet' });
      }
    }
  }
}
