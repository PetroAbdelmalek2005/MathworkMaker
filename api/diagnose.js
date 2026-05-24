export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ ok: false, stage: 'env', error: 'GEMINI_API_KEY is not set in environment variables' });
  }

  const keyPreview = `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

  let raw;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say "ok"' }] }],
        generationConfig: { maxOutputTokens: 4 },
      }),
    });
    raw = await response.json().catch(() => null);

    if (!response.ok) {
      return res.status(200).json({
        ok: false,
        stage: 'gemini',
        keyPreview,
        httpStatus: response.status,
        geminiStatus: raw?.error?.status ?? null,
        geminiMessage: raw?.error?.message ?? null,
        isZeroQuota: raw?.error?.message?.includes('limit: 0') ?? false,
      });
    }

    return res.status(200).json({ ok: true, keyPreview, response: raw });
  } catch (err) {
    return res.status(200).json({ ok: false, stage: 'fetch', keyPreview, error: err.message });
  }
}
