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

  const cls = String(className || "10").replace(/[^0-9]/g, '') || "10";
  const sub = subject || "Science";

  // Dynamic class-specific depth and page scaling criteria
  let depthSpecs = "";
  if (cls === "9") {
    depthSpecs = `
TARGET LENGTH: 7 - 8 Complete PDF Pages
- Comprehensive conceptual breakdown of every single sub-concept.
- 4 In-depth Formula cards with complete SI unit and symbol breakdowns.
- 2 Full tabular differences (e.g. Speed vs Velocity, Longitudinal vs Transverse).
- 4 Step-by-step solved board numericals (Given, Formula, Step-by-Step Substitution, Final Answer Box).
- 5 Common CBSE exam traps + 1 Detailed 5-mark long answer question blueprint.`;
  } else if (cls === "10") {
    depthSpecs = `
TARGET LENGTH: 9 - 10 Complete PDF Pages
- Exhaustive NCERT & Board Syllabus coverage covering every single topic.
- Complete reaction/formula master bank with balanced equations & constants.
- 3 Detailed multi-row comparison tables.
- 5 Solved high-probability board numericals/reactions with full working.
- Ray/Circuit/Biology diagram walkthroughs with critical labels.
- 6 High-yield exam traps + 2 Complete 5-mark answer scoring blueprints.`;
  } else if (cls === "11") {
    depthSpecs = `
TARGET LENGTH: 11 - 13 Complete PDF Pages
- Rigorous academic conceptual depth with clear physical intuition.
- All Core Mathematical Derivations written out step-by-step with clean text justification.
- Complete formula sheet with dimensional formulas, sign conventions, and boundary limits.
- 6 Solved advanced board numericals with multi-step substitution.
- 3 Detailed comparison tables + 8 Exam pitfalls/traps + 2 Five-mark board proofs.`;
  } else {
    // Class 12
    depthSpecs = `
TARGET LENGTH: 13 - 15 Complete PDF Pages (Exhaustive Board Masterclass)
- Zero topics omitted. Provide an end-to-end masterclass for CBSE Board exams.
- ALL Core Board Derivations written out in complete step-by-step format (e.g. Gauss's Law, Dipole fields, Capacitance, Lens Maker's, etc.).
- Complete Master Formula Deck with SI units, vector forms, and constants.
- 8 Solved high-weightage 3-mark & 5-mark numerical problems with complete Given/Formula/Calculation/Unit breakdown.
- 4 Multi-column comparison tables.
- 10 Topper exam traps, sign convention rules, and 3 Complete 5-mark question blueprints.`;
  }

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3.6-flash"
  ];

  const masterPrompt = `
You are the Academic Director and a CBSE National Board Topper creating an elite, exhaustive, multi-page Masterclass Revision Notebook for:
CLASS: Class ${cls}
SUBJECT: ${sub}
CHAPTER: "${chapter}"

SPECIFIC DEPTH & PAGE SCALE REQUIREMENTS:
${depthSpecs}

CRITICAL FORMATTING & NOTATION RULES:
1. NEVER output raw LaTeX syntax (no "\\frac", "\\lambda", "\\nu", "\\times", "\\text{}", "\\quad", or "$$").
2. Write all math and physics formulas in clean Unicode plain text (e.g. write "v = f × λ", "F = (1 / (4πε₀)) × (|q₁q₂| / r²)", "E_axial = (2kp) / r³", "d = (v × t) / 2").
3. Use high-contrast, structured Bento cards and scannable bullet points. Do NOT output giant unbroken text blocks.
4. Output raw HTML ONLY. Do not wrap in markdown \`\`\`html or \`\`\` code fences.

MANDATORY HTML STRUCTURE:

1. <div class="note-hero-card">
     <div class="note-hero-title">📖 MASTER MODULE: ${chapter.toUpperCase()}</div>
     <div class="note-hero-tags">
       <span class="note-tag">🎯 CBSE Class ${cls} ${sub}</span>
       <span class="note-tag">⚡ High Weightage</span>
       <span class="note-tag">📝 Comprehensive Topper Notes</span>
     </div>
   </div>

2. <div class="note-section-title">1. SYLLABUS ROADMAP & CORE THEMES</div>
   <div class="note-card-grid">
     (Provide 4 to 6 distinct cards using <div class="note-card"><strong>Subtopic Title</strong><p>Crisp 2-sentence explanation.</p></div>)
   </div>

3. <div class="note-section-title">2. IN-DEPTH CONCEPTUAL THEORY & DEFINITIONS</div>
   (Cover all NCERT concepts topic-by-topic using <div class="note-concept-box"><strong>Concept Name:</strong> Core rules, key terms, and bulleted breakdowns.</div>)

4. <div class="note-section-title">3. CORE DERIVATIONS & SCIENTIFIC PROOFS</div>
   (Include all major derivations for Class ${cls} with step-by-step mathematical progression inside <div class="note-derivation-card">.)

5. <div class="note-section-title">4. MASTER FORMULA & CONSTANT SHEET</div>
   (Wrap every formula inside <div class="note-formula-card"><div class="formula-main">Formula: ...</div><div class="formula-sub"><strong>Where:</strong> Variable definitions & SI units</div></div>)

6. <div class="note-section-title">5. TABULAR COMPARISONS & DIFFERENCES</div>
   (Provide the required comparison tables using <table class="note-table"><thead><tr><th>Parameter</th><th>Category A</th><th>Category B</th></tr></thead><tbody><tr><td>Point</td><td>...</td><td>...</td></tr></tbody></table>)

7. <div class="note-section-title">6. STEP-BY-STEP BOARD NUMERICALS / SOLVED EXAMPLES</div>
   (Provide the required number of solved numericals formatted cleanly inside <div class="note-numerical-card"> with Question, Given Data, Formula, Step-by-step Calculation, and Final Answer Box.)

8. <div class="note-section-title">7. 🎯 TOPPER EXAM TRAPS & 5-MARK BLUEPRINTS</div>
   <div class="note-trap-box">
     <div class="trap-head">⚠️ High-Yield Board Mistakes to Avoid:</div>
     <p>⭐ [Trap 1: Common sign/unit/conceptual pitfalls]</p>
     <p>⭐ [Trap 2: Common deduction reasons on CBSE marking schemes]</p>
     <div class="blueprint-head">📝 5-Mark Question Blueprint:</div>
     <p>👉 [Step-by-step breakdown: Title, required headings, diagram labels, and marking distribution]</p>
   </div>

9. <div class="note-section-title">8. HIGH-YIELD KEYWORDS & MNEMONICS ⭐</div>
   <div class="note-keywords">
     (Provide 10 to 14 keyword chips using <span class="note-keyword-chip">Keyword</span>)
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
          contents: [{ role: "user", parts: [{ text: masterPrompt }] }],
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
