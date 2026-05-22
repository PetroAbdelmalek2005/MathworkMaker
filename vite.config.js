import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { buildPrompt } from './src/prompts/worksheetPrompt.js'

function apiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/generate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json')
          try {
            const { grade, topic, difficulty } = JSON.parse(body)
            const apiKey = process.env.GEMINI_API_KEY
            if (!apiKey) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set. Add it to a .env.local file.' }))
              return
            }

            const { system, user } = buildPrompt(grade, topic, difficulty)
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`

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
            })

            if (!response.ok) {
              const err = await response.json().catch(() => null)
              if (response.status === 429) {
                const retryDelay = err?.error?.details
                  ?.find((d) => d['@type']?.endsWith('RetryInfo'))
                  ?.retryDelay?.replace('s', '')
                const seconds = retryDelay ? Math.ceil(Number(retryDelay)) : 60
                res.statusCode = 429
                res.end(JSON.stringify({ error: `Rate limit. Retry in ${seconds}s.`, retryAfter: seconds }))
                return
              }
              const message = err?.error?.message || `Gemini error ${response.status}`
              throw new Error(message)
            }

            const data = await response.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
            if (!text) throw new Error('Gemini returned an empty response')
            res.statusCode = 200
            res.end(text)
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message || 'Failed to generate worksheet' }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
})
