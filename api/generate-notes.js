module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cls = req.body.className || req.body.classLevel || '9';
  const sub = req.body.subject || 'Physics';
  const chapter = req.body.chapter || 'Sound';
  const customStructure = req.body.structure;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel settings.' });
  }

  const promptText = customStructure || `Act as an expert CBSE teacher and national board topper. Generate comprehensive, syllabus-accurate revision notes in clean HTML for Class ${cls} ${sub}, Chapter: ${chapter}. Include Key definitions, Formulas, Exam Traps, and High-Yield Board Points.`;

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
        lastError = data.error?.message || 'Model execution error';
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(500).json({ error: `AI generation failed: ${lastError}` });
};
