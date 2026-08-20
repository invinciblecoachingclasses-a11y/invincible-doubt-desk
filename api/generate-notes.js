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
    return res.status(500).json({ error: "GEMINI_API_KEY is missing in Vercel settings." });
  }

  const { className, subject, chapter } = req.body || {};

  if (!chapter) {
    return res.status(400).json({ error: "Please enter a chapter name." });
  }

  const cls = String(className || "10").replace(/[^0-9]/g, '') || "10";
  const sub = subject || "Physics";

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3.6-flash"
  ];

  // Dynamic Scale & Architecture by Class Level
  let depthInstructions = "";
  if (cls === "9") {
    depthInstructions = `
TARGET SCALE: 7 to 8 Full Pages Depth
- Break down every foundational NCERT concept with high clarity.
- 4 Full Formula Cards with SI units, scalar/vector nature, and variable definitions.
- 2 Comprehensive Comparison Tables (3+ parameters each).
- 4 Solved Board Numericals with Given Data, Formula, Substitution, and SI Unit.
- 5 Topper Exam Traps + 1 Complete 5-Mark Question Blueprint.
- 10 High-Yield Keywords.`;
  } else if (cls === "10") {
    depthInstructions = `
TARGET SCALE: 9 to 10 Full Pages Depth
- Deep CBSE Board-oriented theory covering all subtopics, ray/circuit/reaction conventions.
- Complete Formula & Balanced Chemical Reaction Deck (5+ cards).
- 3 Detailed Multi-Column Comparison Tables.
- 5 Step-by-Step Solved Board Numericals / Balanced Equations with exact arithmetic.
- 6 High-Probability Exam Traps + 2 Five-Mark Question Skeletons with diagram instructions.
- 12 High-Yield Keywords.`;
  } else if (cls === "11") {
    depthInstructions = `
TARGET SCALE: 11 to 13 Full Pages Depth
- Advanced Conceptual & Mathematical foundations (Calculus/Trigonometric laws).
- Step-by-Step Derivations written with full mathematical rigor in clean text.
- Master Formula Deck with boundary conditions, vector notations, and dimensional formulas.
- 3 Advanced Difference Tables.
- 6 Solved Numericals (Standard Board + JEE/NEET crossover difficulty).
- 8 Common Calculation & Sign Convention Pitfalls + 2 Five-Mark Proof Blueprints.
- 14 High-Yield Keywords.`;
  } else {
    // Class 12
    depthInstructions = `
TARGET SCALE: 13 to 15 Full Pages Depth (Exhaustive Board Masterclass)
- Complete, non-summarized coverage of every single NCERT subtopic, rule, and law.
- ALL Core Board Derivations written out step-by-step with mathematical reasons in clean text.
- Full Formula Deck with dielectric, vector, phase, and matrix notations where applicable.
- 4 Comprehensive Comparison Tables (4+ parameters each).
- 8 Solved Board Numericals covering standard 3-mark & 5-mark patterns with exact substitution steps.
- 10 Topper Exam Traps (sign traps, unit conversions, subtle concept traps).
- 3 Full 5-Mark Question Blueprints (Step Breakdown, Diagram Labels, Examiner Keywords).
- 16 High-Yield Keywords.`;
  }

  const exhaustivePrompt = `
You are the Head of Academics at a top Indian coaching institute and a CBSE National Board Topper creating an EXHAUSTIVE, MULTI-PAGE revision module for:
CLASS: Class ${cls}
SUBJECT: ${sub}
CHAPTER: "${chapter}"

CLASS-SPECIFIC DEPTH REQUIREMENT:
${depthInstructions}

STRICT VISUAL & NOTATION RULES:
1. NEVER output raw LaTeX syntax (no "\\frac", "\\lambda", "\\nu", "\\times", "\\text{}", "\\quad", "\\mu", "\\varepsilon", or "$$").
2. Write clean Unicode/text mathematical symbols (e.g., "v = f × λ", "F = (1 / 4πε₀) × (|q₁q₂| / r²)", "E_axial = (2kp) / r³", "d = (v × t) / 2").
3. Use high-contrast Bento cards and crisp bullet points. No walls of dense, unformatted text.
4. Output raw HTML ONLY. Do not wrap in markdown \`\`\`html or \`\`\` code fences.

MANDATORY HTML STRUCTURE TO GENERATE:

1. <div class="note-hero-card">
     <div class="note-hero-title">📖 MASTER MODULE: ${chapter.toUpperCase()}</div>
     <div class="note-hero-tags">
       <span class="note-tag">🎯 CBSE Class ${cls} ${sub}</span>
       <span class="note-tag">⚡ High Weightage</span>
       <span class="note-tag">📚 Comprehensive Board Module</span>
     </div>
   </div>

2. <div class="note-section-title">1. SYLLABUS ROADMAP & CORE CONCEPTS</div>
   <div class="note-card-grid">
     (Generate required number of <div class="note-card"><strong>Concept Name</strong><p>Clear, precise explanation with key rules.</p></div>)
   </div>

3. <div class="note-section-title">2. CORE DERIVATIONS & MATHEMATICAL PROOFS</div>
   (Provide step-by-step derivations using <div class="note-derivation-card"><div class="deriv-title">Proof: [Title]</div><div class="deriv-step">Step 1: ...</div><div class="deriv-step">Step 2: ...</div></div>)

4. <div class="note-section-title">3. MASTER FORMULA & EQUATION SHEET</div>
   (For every critical formula, use:
     <div class="note-formula-card">
       <div class="formula-main">Formula: [Write formula in clean Unicode text]</div>
       <div class="formula-sub"><strong>Where:</strong> [Symbol meanings, SI units & conditions]</div>
     </div>
   )

5. <div class="note-section-title">4. TABULAR COMPARISONS & DIFFERENCES</div>
   (Generate required comparison tables using:
     <table class="note-table">
       <thead><tr><th>Parameter</th><th>Category A</th><th>Category B</th></tr></thead>
       <tbody><tr><td>Key Point</td><td>...</td><td>...</td></tr></tbody>
     </table>
   )

6. <div class="note-section-title">5. STEP-BY-STEP SOLVED BOARD NUMERICALS</div>
   (Generate required numerical cards:
     <div class="note-numerical-card">
       <div class="num-q"><strong>Q:</strong> [Problem Statement]</div>
       <div class="num-step"><strong>Given Data:</strong> [Values with units]</div>
       <div class="num-step"><strong>Formula Applied:</strong> [Clean formula]</div>
       <div class="num-step"><strong>Step-by-Step Calculation:</strong> [Clear algebraic substitution]</div>
       <div class="num-ans"><strong>Final Answer:</strong> [Result with SI unit]</div>
     </div>
   )

7. <div class="note-section-title">6. 🎯 TOPPER EXAM TRAPS & 5-MARK BLUEPRINTS</div>
   <div class="note-trap-box">
     <div style="font-weight:900; color:#e11d48; margin-bottom:8px; font-size:16px;">⚠️ Common Board Traps & Penalties to Avoid:</div>
     (Generate bullet points starting with ⭐)
     <div style="font-weight:900; color:#4338ca; margin-top:14px; margin-bottom:6px; font-size:16px;">📝 5-Mark Master Question Blueprints:</div>
     (Generate question title + step-by-step marking scheme breakdown)
   </div>

8. <div class="note-section-title">7. HIGH-YIELD KEYWORDS ⭐</div>
   <div class="note-keywords">
     (Generate keyword chips using <span class="note-keyword-chip">Keyword</span>)
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
          contents: [{ role: "user", parts: [{ text: exhaustivePrompt }] }],
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
