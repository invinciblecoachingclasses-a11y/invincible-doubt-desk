export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { subject, question, image, tone, history } = req.body || {};

    if (!question && !image && (!history || history.length === 0)) {
      return res.status(400).json({ error: "Please enter a question or upload a photo." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured." });
    }

    // Dynamic Tone Instructions
    let toneInstruction = "";
    if (tone === "tldr") {
      toneInstruction = `
MODE: TL;DR FORMULA & INSTANT ANSWER
- Give ONLY the core formula and 1-line substitution.
- State the final calculated answer directly.
- Add a 1-line "Common Mistake" alert.`;
    } else if (tone === "eli10") {
      toneInstruction = `
MODE: CONCEPTUAL & ANALOGY
- Explain the concept using simple, relatable real-world analogies (video games, pizza, vehicles).
- Use friendly, cheerful Hinglish and break into small bite-sized points.`;
    } else {
      toneInstruction = `
MODE: STRUCTURED STEP-BY-STEP CLASSROOM BOARD
- Break the solution into clear steps with bullet points.
- Use centered standard LaTeX math equations ($$ ... $$) for all formulas, substitutions, and steps.
- Explain the logic clearly in conversational Hinglish.`;
    }

    const systemInstruction = `
You are a master teacher at Invincible Coaching Classes for CBSE/State Board students.

Subject: ${subject || "General"}

Tone & Mode:
${toneInstruction}

STRICT OUTPUT FORMAT RULES:
1. Start directly with an engaging 1-line opening in Hinglish.
2. For all Mathematical and Scientific formulas, equations, fractions, and integrals, ALWAYS use standard LaTeX math enclosed in dollar signs:
   - Inline math: $x^2 - 1$, $\\sqrt{a^2 + b^2}$, $\\int f(x) dx$
   - Display equations (separate line): $$\\int \\frac{x+2}{\\sqrt{x^2 - 1}} dx$$
3. Structure your response into clean sections:
   - 🎯 **Direct Approach & Formula**
   - 🧠 **Step-by-Step Solution** (with clean LaTeX steps)
   - 💡 **Final Answer**
   - 🚨 **Common Student Mistakes (सावधानियां)**: List 1 to 2 exact errors students frequently make in this specific type of question (e.g. missing constant $+ C$, sign mistakes, incorrect substitution).
4. If this is a follow-up question in an ongoing chat, answer the student's doubt directly based on previous context.
`;

    // Construct multi-turn contents
    let contents = [];

    if (Array.isArray(history) && history.length > 0) {
      contents = history.map(item => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.content }]
      }));
    }

    // Prepare current prompt part
    const currentParts = [];
    if (question) {
      currentParts.push({ text: `[Subject: ${subject || "General"}]\n${question}` });
    }

    if (image && image.data) {
      currentParts.push({
        inline_data: {
          mime_type: image.mimeType || "image/jpeg",
          data: image.data.replace(/^data:image\/\w+;base64,/, "")
        }
      });
    }

    if (currentParts.length > 0) {
      contents.push({ role: "user", parts: currentParts });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1200
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return res.status(response.status).json({
        error: data?.error?.message || "Unable to get solution from Gemini."
      });
    }

    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!answer) {
      return res.status(500).json({ error: "Gemini returned an empty answer." });
    }

    return res.status(200).json({
      success: true,
      subject: subject || "General",
      answer: answer
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message || "Something went wrong." });
  }
}
