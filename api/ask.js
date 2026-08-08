export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { subject, question } = req.body || {};

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel."
      });
    }

    const prompt = `
You are the AI teacher for Invincible Coaching Classes.

Subject: ${subject || "General"}

Student's question:
${question}

Solve this like an excellent CBSE teacher.

Rules:
- Assume the student may be a beginner.
- Explain the concept simply.
- Solve step by step.
- Do not give only the final answer.
- For Mathematics: show calculations clearly.
- For Physics: show formula, substitution, units and reasoning.
- For Chemistry: explain the concept/reaction/calculation clearly.
- For numericals use:
  Given
  Required
  Formula
  Substitution
  Calculation
  Final Answer
- If the question is incomplete, clearly state what information is missing.
`;

    /*
      IMPORTANT:
      We will change ONLY this model name if Google reports
      that this model is unavailable for your account.
    */
    const model = "gemini-2.5-flash-lite";

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      model +
      ":generateContent?key=" +
      encodeURIComponent(apiKey);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(response.status).json({
        error: data?.error?.message || "Gemini API request failed."
      });
    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!answer) {
      return res.status(500).json({
        error: "Gemini returned no answer."
      });
    }

    return res.status(200).json({
      answer
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Server error while solving the doubt."
    });
  }
}