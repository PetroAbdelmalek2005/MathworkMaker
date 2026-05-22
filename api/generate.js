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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

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
        const errBody = await response.json().catch(() => null);

        if (response.status === 429) {
          const retryDelay = errBody?.error?.details
            ?.find((d) => d['@type']?.endsWith('RetryInfo'))
            ?.retryDelay?.replace('s', '');
          const seconds = retryDelay ? Math.ceil(Number(retryDelay)) : 60;
          return res.status(429).json({
            error: `Rate limit reached. Please try again in ${seconds} seconds.`,
            retryAfter: seconds,
          });
        }

        const message = errBody?.error?.message || `Gemini API error ${response.status}`;
        throw new Error(message);
      }

      const data = await response.json();

      if (!data.candidates?.length) {
        const reason = data.promptFeedback?.blockReason;
        throw new Error(reason ? `Request blocked by Gemini: ${reason}` : 'Gemini returned no candidates');
      }

      const text = data.candidates[0].content?.parts?.[0]?.text?.trim();
      if (!text) throw new Error('Gemini returned an empty response');

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
