import { buildPrompt } from '../src/prompts/worksheetPrompt.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { grade, topic, difficulty } = req.body;

  if (!grade || !topic || !difficulty) {
    return res.status(400).json({ error: 'Missing required fields: grade, topic, difficulty' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const { system, user } = buildPrompt(grade, topic, difficulty);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system,
          messages: [{ role: 'user', content: user }],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Claude API error ${response.status}: ${err}`);
      }

      const data = await response.json();
      const text = data.content[0].text.trim();

      // Strip markdown code fences if Claude adds them despite instructions
      const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleaned);

      return res.status(200).json(parsed);
    } catch (err) {
      if (attempt === 1) {
        console.error('Failed after 2 attempts:', err);
        return res.status(500).json({ error: err.message || 'Failed to generate worksheet' });
      }
    }
  }
}
