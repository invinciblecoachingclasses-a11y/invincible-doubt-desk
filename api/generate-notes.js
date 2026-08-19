export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cls = req.body.className || req.body.classLevel || '9';
  const sub = req.body.subject || 'Physics';
  const chapter = req.body.chapter || 'Sound';
  const customStructure = req.body.structure;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel environment variables.' });
  }

  const promptText = customStructure || `Act as an expert CBSE teacher and topper. Generate complete revision notes in clean HTML (do not use markdown blocks) for Class ${cls} ${sub}, Chapter: ${chapter}. Include Key definitions, Formulas, Exam Traps, and High-Yield Board Points.`;

  // List of fallback models if one is not enabled
  const modelEndpoints = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'gemini-pro'
  ];

  let lastError = null;

  for (const modelName of modelEndpoints) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        let generatedHTML = data.candidates[0].content.parts[0].text;
        generatedHTML = generatedHTML.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');
        
        return res.status(200).json({ notes: generatedHTML });
      } else {
        lastError = data.error?.message || 'Model call failed';
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(500).json({ error: `All model endpoints failed: ${lastError}` });
}
