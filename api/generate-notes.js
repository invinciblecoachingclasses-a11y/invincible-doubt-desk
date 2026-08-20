// api/generate-notes.js

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is missing from Vercel settings." });
  }

  const { className, subject, chapter } = req.body || {};

  if (!chapter) {
    return res.status(400).json({ error: "Please enter a chapter name." });
  }

  const cls = className || "Class 10";
  const sub = subject || "Science";

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3.6-flash"
  ];

  const topperPrompt = `
You are the Head of Academics and a CBSE National Board Topper creating an elite, visually rich, and scannable revision module for:
CLASS: ${cls}
SUBJECT: ${sub}
CHAPTER: "${chapter}"

CRITICAL FORMATTING & NOTATION RULES:
1. NEVER output raw LaTeX syntax like "\\frac", "\\lambda", "\\nu", "\\times", "\\text{}", "\\quad", or "$$". 
2. Write all math and physics symbols in clean plain text and Unicode (e.g., write "v = f × λ", "d = (v × t) / 2", "1/f = 1/v - 1/u", "CO₂ + H₂O → C₆H₁₂O₆ + O₂").
3. Use bullet points and high-contrast Bento cards. Do NOT write dense, multi-sentence paragraphs.
4. Output raw HTML ONLY. Do not wrap in markdown \`\`\`html or \`\`\` code fences.

MANDATORY SECTIONS TO INCLUDE:

1. <div class="note-hero-card">
     <div class="note-hero-title">📖 MASTER MODULE: ${chapter.toUpperCase()}</div>
     <div class="note-hero-tags">
       <span class="note-tag">🎯 CBSE Class ${cls} ${sub}</span>
       <span class="note-tag">⚡ High Weightage</span>
       <span class="note-tag">⏱️ 10-Min Fast Revision</span>
     </div>
   </div>

2. <div class="note-section-title">1. CHAPTER FAST MAP & CORE DEFINITIONS</div>
   <div class="note-card-grid">
     (Provide 3 to 4 distinct cards using <div class="note-card"> with <strong>Term</strong> and a concise 1-2 sentence definition.)
   </div>

3. <div class="note-section-title">2. MASTER FORMULA & EQUATION SHEET</div>
   (For every critical formula/reaction, use:
     <div class="note-formula-card">
       <div class="formula-main">Formula: [Write clear formula in plain text]</div>
       <div class="formula-sub"><strong>Where:</strong> [Symbol definitions & SI units]</div>
     </div>
   )

4. <div class="note-section-title">3. TABULAR COMPARISONS & DIFFERENCES</div>
   (Provide at least one essential CBSE difference table using:
     <table class="note-table">
       <thead><tr><th>Parameter</th><th>Category A</th><th>Category B</th></tr></thead>
       <tbody><tr><td>Key Point</td><td>...</td><td>...</td></tr></tbody>
     </table>
   )

5. <div class="note-section-title">4. STEP-BY-STEP BOARD NUMERICALS / SOLVED EXAMPLES</div>
   (Provide 2 to 3 standard numerical problems formatted cleanly:
     <div class="note-numerical-card">
       <div class="num-q"><strong>Q:</strong> [Problem statement]</div>
       <div class="num-step"><strong>Given:</strong> [Values with units]</div>
       <div class="num-step"><strong>Formula:</strong> [Formula used]</div>
       <div class="num-step"><strong>Calculation:</strong> [Clean step-by-step substitution]</div>
       <div class="num-ans"><strong>Final Answer:</strong> [Result with correct SI unit]</div>
     </div>
   )

6. <div class="note-section-title">5. 🎯 TOPPER EXAM TRAPS & 5-MARK BLUEPRINT</div>
   <div class="note-trap-box">
     <div style="font-weight:900; color:#e11d48; margin-bottom:6px;">⚠️ Common Board Mistakes to Avoid:</div>
     <p>⭐ [Common mistake 1: calculation, sign conventions, or unit errors]</p>
     <p>⭐ [Common mistake 2: keyword omissions examiners deduct marks for]</p>
     <div style="font-weight:900; color:#4338ca; margin-top:10px; margin-bottom:4px;">📝 5-Mark Question Blueprint:</div>
     <p>👉 [Exact sub-points, required headings, and diagram labels needed for full marks]</p>
   </div>

7. <div class="note-section-title">6. HIGH-YIELD KEYWORDS ⭐</div>
   <div class="note-keywords">
     (Provide 8 to 10 keyword chips using <span class="note-keyword-chip">Keyword</span>)
   </div>
`;

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: topperPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192
          }
        })
      });

      const data = await response.json();

      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        let generatedText = data.candidates[0].content.parts[0].text;
        generatedText = generatedText
          .replace(/^```html\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        return res.status(200).json({
          success: true,
          notes: generatedText
        });
      } else {
        lastError = data?.error?.message || `Model ${model} failed`;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(503).json({ error: "Service busy. Details: " + lastError });
}
