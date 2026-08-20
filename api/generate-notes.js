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
  const MODEL = "gemini-3.6-flash"; // Reliable, fast endpoint with large context window

  // Custom Subject Logic
  let subjectStyle = "";
  if (sub.toLowerCase() === "physics") subjectStyle = "Focus on physical meaning, derivations, graphs, free-body diagrams, units, and logical reasoning behind formulas.";
  else if (sub.toLowerCase() === "chemistry") subjectStyle = "Focus on chemical reactions, structures, mechanisms, periodic trends, standard conditions, and exceptions.";
  else if (sub.toLowerCase() === "mathematics") subjectStyle = "Focus on generalized formulas, conditions of applicability, distinct solving methods, step-by-step solutions, and identifying question patterns.";
  else if (sub.toLowerCase() === "biology") subjectStyle = "Focus strictly on NCERT terminology, processes, flowcharts, structural comparisons, and logical functions.";
  else subjectStyle = "Focus on clear concepts, standard definitions, and logical reasoning.";

  const lengthInstruction = (cls === "9" || cls === "10") 
    ? "Generate highly extensive content equivalent to exactly 10 pages in print." 
    : "Generate highly extensive and deep content equivalent to exactly 12 pages in print.";

  const masterPrompt = `
You are the Academic Director of a premier coaching institute (like in Kota) creating a highly professional, strictly accurate CBSE/NCERT study module.

TARGET: Class ${cls} | Subject: ${sub} \vert{} Chapter: "${chapter}"
${lengthInstruction} Never stretch content unnecessarily, but ensure exhaustive depth.

CRITICAL RULES FOR AI:
1. NO LATEX ALLOWED. NEVER use $,$$, \\frac, \\lambda, \\nu, \\times, or \\text. Use standard text (e.g., v = f * wavelength, H2O).
2. OUTPUT ONLY RAW HTML. Do not use Markdown (no \`\`\`, no **).
3. SUBJECT STYLE: ${subjectStyle}

MODULE ARCHITECTURE (Generate strictly in this order, using the provided HTML classes):

--- PART 1: PREMIUM STUDY NOTES ---
Flow for every topic: Concept → Simple Explanation → Logic/Derivation → Formula/Rule → Example → Exam Point → Common Mistake.

Use these EXACT HTML snippets:
- Hero: <div class="module-hero"><div class="module-hero-title">${chapter}</div><div class="module-hero-subtitle">Class ${cls} ${sub} | Premium Study Module</div></div>
- Main Heading: <h2 class="kota-h2">1. Topic Name</h2>
- Sub Heading: <h3 class="kota-h3">1.1 Subtopic Name</h3>
- Concept Block: <div class="kota-concept"><strong>Concept:</strong> Explanation...</div>
- Formula Block: <div class="kota-formula"><div class="kota-formula-title">📌 MUST REMEMBER FORMULA</div>[Formula logic here]</div>
- Key Result/Exam Point: <div class="kota-result"><div class="kota-result-title">🎯 EXAM POINT</div>[Text]</div>
- Common Mistake: <div class="kota-mistake"><div class="kota-mistake-title">⚠️ COMMON MISTAKE</div>[Text]</div>
- Table: <div class="kota-table-wrap"><table class="kota-table"><tr><th>A</th><th>B</th></tr><tr><td>...</td><td>...</td></tr></table></div>

--- PART 2: CHAPTER TEST (Use <div class="page-break"></div> before this) ---
Create a professional coaching-style test.
- Header: <div class="kota-test-header"><h2>CHAPTER ASSESSMENT: ${chapter}</h2><p>Time: 60 Min | Max Marks: 30</p><p>Difficulty: 30% Easy | 50% Moderate | 20% Difficult</p></div>
- Include sections: Section A (MCQs & Assertion-Reason), Section B (Short Answer), Section C (Case/Source Based), Section D (Long Answer).
- Use <div class="kota-question"><div class="kota-question-text">Q1. ...</div></div> format. Leave visual space for writing.

--- PART 3: ANSWER KEY (Use <div class="page-break"></div> before this) ---
<h2 class="kota-h2">MARKING SCHEME & ANSWER KEY</h2>
Provide step-by-step marking schemes (e.g., "1 mark for formula, 1 mark for correct unit").

--- PART 4: FINAL REVISION PAGE (Use <div class="page-break"></div> before this) ---
<h2 class="kota-h2">FINAL REVISION & RANK BOOSTER</h2>
Include:
1. Rapid Revision Fact Sheet.
2. Top 3 Exam Concepts.
3. 5 Must-Practice Question Patterns.

Make the HTML clean, professional, and dense with high-value academic knowledge.
`;

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: masterPrompt }] }],
        generationConfig: { 
          temperature: 0.2, // Low temperature for high factual accuracy
          maxOutputTokens: 8192 // Max out tokens to accommodate the massive 10-12 page requirement
        }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Generation failed." });

    let generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Clean out any accidental markdown wrapper from the AI
    generatedText = generatedText.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    return res.status(200).json({ success: true, notes: generatedText });
  } catch (error) {
    return res.status(500).json({ error: "Server error: " + error.message });
  }
}
