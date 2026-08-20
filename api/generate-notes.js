// api/generate-notes.js
export const maxDuration = 60; // Tells Vercel to allow maximum time for generation

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST requests are allowed." });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is missing." });

  const { className, subject, chapter } = req.body || {};
  if (!chapter) return res.status(400).json({ error: "Please enter a chapter name." });

  const cls = String(className || "10").replace(/[^0-9]/g, '') || "10";
  const sub = subject || "Science";
  const MODEL = "gemini-3.6-flash"; // Highly reliable, fast endpoint

  // Dynamic Scaling
  let depthSpecs = "";
  if (cls === "9" || cls === "10") {
    depthSpecs = `Generate 4 to 5 highly dense, high-yield sections. Focus on core definitions, formula cards, 3 solved board numericals, and 5 common board traps.`;
  } else {
    depthSpecs = `Generate 6 to 8 highly dense, high-yield sections. Focus on advanced derivations (broken into clear steps), complex formulas, 4 solved numericals, and 8 critical JEE/NEET/Board traps.`;
  }

  const masterPrompt = `
You are the Academic Director and a CBSE Board Topper creating an elite, hyper-dense "Cheat Sheet" Revision Notebook for:
CLASS: Class ${cls}
SUBJECT: ${sub}
CHAPTER: "${chapter}"

CRITICAL RULES FOR AI:
1. NO LATEX ALLOWED. NEVER use $, $$, \\frac, \\lambda, \\nu, \\times, or \\text. 
2. Use standard keyboard symbols: write "v = f * wavelength", "CO2 + H2O -> C6H12O6", "d = (v * t) / 2".
3. NO WALLS OF TEXT. Use short bullet points (max 2 sentences per point).
4. Output ONLY raw HTML. No markdown formatting.

REQUIREMENTS:
${depthSpecs}

USE EXACTLY THESE HTML STRUCTURES:

1. HERO SECTION:
<div class="note-hero-card">
  <div class="note-hero-title">📖 MASTER MODULE: ${chapter.toUpperCase()}</div>
  <div class="note-hero-tags">
    <span class="note-tag">🎯 Class ${cls} ${sub}</span><span class="note-tag">⚡ High Yield</span>
  </div>
</div>

2. FAST-MAP / DEFINITIONS:
<div class="note-section-title">1. CORE CONCEPTS</div>
<div class="note-concept-box"><strong>Concept:</strong> Explanation.</div>

3. FORMULAS (Use this for all math/reactions):
<div class="note-section-title">2. MASTER FORMULAS</div>
<div class="note-formula-card">
  <div class="formula-main">Formula: [Plain text math]</div>
  <div class="formula-sub"><strong>Where:</strong> [Units and symbols]</div>
</div>

4. DIFFERENCE TABLES:
<div class="note-section-title">3. TABULAR DIFFERENCES</div>
<table class="note-table"><tr><th>Feature</th><th>A</th><th>B</th></tr><tr><td>...</td><td>...</td><td>...</td></tr></table>

5. SOLVED NUMERICALS / PROOFS:
<div class="note-section-title">4. BOARD NUMERICALS</div>
<div class="note-numerical-card">
  <div class="num-q"><strong>Q:</strong> Question text</div>
  <div class="num-step"><strong>Given:</strong> Data</div>
  <div class="num-step"><strong>Formula:</strong> Text</div>
  <div class="num-ans"><strong>Answer:</strong> Final unit</div>
</div>

6. TRAPS & BLUEPRINTS:
<div class="note-section-title">5. EXAM TRAPS & 5-MARK HACKS</div>
<div class="note-trap-box">
  <div class="trap-head">⚠️ Avoid These Mistakes:</div>
  <p>⭐ Trap 1...</p>
  <div class="blueprint-head">📝 5-Mark Hack:</div>
  <p>👉 Step 1...</p>
</div>
`;

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: masterPrompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 6000 }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Generation failed." });

    let generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    generatedText = generatedText.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    return res.status(200).json({ success: true, notes: generatedText });
  } catch (error) {
    return res.status(500).json({ error: "Server error: " + error.message });
  }
}
