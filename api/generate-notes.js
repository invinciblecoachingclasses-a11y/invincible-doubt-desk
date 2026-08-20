// api/generate-notes.js

export default async function handler(req, res) {
  // CORS Headers
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
    return res.status(500).json({ error: "GEMINI_API_KEY is missing in Vercel environment variables." });
  }

  const { className, subject, chapter, structure } = req.body || {};

  if (!chapter) {
    return res.status(400).json({ error: "Please enter a chapter name." });
  }

  const cls = className || "Class 9";
  const sub = subject || "Physics";

  // Updated to the current production model
  const MODEL = "gemini-3.6-flash";

  const prompt = `
You are an expert CBSE school teacher and national board topper creating condensed, visually engaging revision notes.

CLASS: ${cls}
SUBJECT: ${sub}
CHAPTER: ${chapter}

INSTRUCTIONS & STRUCTURE:
${structure || `
Generate comprehensive, subject-specific revision notes for CBSE Class ${cls} ${sub}, Chapter:${chapter}.
Subject-specific guidelines:
- Physics: focus on formulas, laws, derivations, numerical hints, and graphs.
- Chemistry: focus on reactions, equations, concepts, and exceptions.
- Biology: focus on processes, terminology, diagrams, and differences.
- Mathematics: focus on formulas, theorems, identities, methods, and examples.

Structure:
1. Chapter overview
2. Important concepts & Key definitions
3. Must-remember points
4. Formulas / equations / reactions
5. Common mistakes
6. Exam-focused points & Quick revision summary
`}

CRITICAL RULES:
1. Every definition, formula, law, and point must be 100% accurate for CBSE ${cls} ${sub}, Chapter: "${chapter}".
2. Do NOT mention any unrelated subject or chapter.
3. Return clean raw HTML ONLY using the required CSS classes:
   - .note-h1 (Main Heading)
   - .note-h2 (Numbered Subheadings)
   - .note-p (Text/Definitions)
   - .note-ul and li (For bullet points)
   - .note-formula (Inside a div for formulas/equations)
   - .note-keywords (div containing spans with class .note-keyword-chip)
   - .note-exam-box (div containing p tags starting with ⭐ for exam points)
4. Do NOT wrap output in markdown \`\`\`html or \`\`\` code fences.
`;

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Notes API Error:", data);
      return res.status(response.status).json({
        error: data?.error?.message || "Failed to generate notes from Gemini."
      });
    }

    let generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    generatedText = generatedText
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    if (!generatedText) {
      return res.status(500).json({ error: "Gemini returned empty notes." });
    }

    return res.status(200).json({
      success: true,
      notes: generatedText
    });

  } catch (error) {
    console.error("Server Error in generate-notes:", error);
    return res.status(500).json({ error: "Internal server error: " + error.message });
  }
}
