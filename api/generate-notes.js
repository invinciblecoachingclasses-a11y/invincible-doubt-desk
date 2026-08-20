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

  const cls = className || "Class 9";
  const sub = subject || "Physics";

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3.6-flash"
  ];

  const exhaustivePrompt = `
You are the Head of Academics at a premier national coaching institute and a CBSE National Board Topper.
Generate an EXHAUSTIVE, MULTI-PAGE, FULL-CHAPTER MASTERCLASS NOTEBOOK for:
GRADE: Class ${cls}
SUBJECT: ${sub}
CHAPTER: "${chapter}"

Generate a thorough, end-to-end chapter module covering EVERY NCERT topic in depth. Do not summarize or skip subtopics.

MANDATORY SECTIONS TO GENERATE:

1. <div class="note-h1">📖 MASTER MODULE: ${chapter.toUpperCase()}</div>
   <div class="note-h2">1. SYLLABUS ROADMAP & CORE THEMES</div>
   Provide a complete breakdown of every sub-concept in this chapter.

2. <div class="note-h2">2. IN-DEPTH CONCEPTUAL THEORY & LAWS</div>
   Explain every topic step-by-step with clear definitions (<p class="note-p">), key principles, and bullet breakdowns (<ul class="note-ul"><li>).

3. <div class="note-h2">3. DERIVATIONS, PROOFS & SCIENTIFIC LAWS</div>
   Provide full step-by-step derivations with clear justification for every mathematical step.

4. <div class="note-h2">4. MASTER FORMULA & EQUATION SHEET</div>
   Wrap all core formulas inside <div class="note-formula"> boxes with symbol definitions, SI units, and boundary conditions.

5. <div class="note-h2">5. STEP-BY-STEP SOLVED NUMERICALS / EXAMPLES</div>
   Include at least 3 standard CBSE board numericals with:
   - Given Data
   - Formula Used
   - Step-by-Step Substitution
   - Final Answer with Units

6. <div class="note-h2">6. TABULAR DIFFERENCES & COMPARISONS</div>
   Include key board comparison tables (e.g., Longitudinal vs. Transverse, Speed vs. Velocity) using clean HTML tables with class "note-table".

7. <div class="note-h2">7. EXAM TRAPS, REASONING & TOPPER TIPS 🎯</div>
   Use <div class="note-exam-box"> to detail:
   - Common calculation and sign mistakes
   - Conceptual tricky questions
   - 5-mark board question predictions

8. <div class="note-h2">8. HIGH-YIELD KEYWORDS & FORMULA RECALL ⭐</div>
   Include 8-12 keywords inside <div class="note-keywords"><span class="note-keyword-chip">...</span></div>.

HTML FORMATTING RULES:
- Use only raw HTML with the classes specified above.
- Do NOT wrap the output in markdown code blocks (\`\`\`html).
- Provide exhaustive, textbook-complete explanations.
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
            temperature: 0.25,
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
