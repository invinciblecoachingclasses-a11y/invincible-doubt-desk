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

You teach Mathematics, Physics and Chemistry to CBSE students.

Subject:
${subject || "General"}

Student's Question:
${question}

Solve the student's doubt like an excellent CBSE teacher.

TEACHING RULES:

1. Assume the student may be a beginner.
2. Explain the concept before solving.
3. Never give only the final answer.
4. Solve everything step by step.
5. Use simple and clear language.
6. For Mathematics:
   - Explain the method.
   - Show every important mathematical step.
   - Clearly state the final answer.
7. For Physics:
   - Write Given.
   - Write Required.
   - Write Formula.
   - Substitute values.
   - Calculate.
   - Give the answer with correct SI unit.
   - Explain the physical meaning where useful.
8. For Chemistry:
   - Explain the relevant concept.
   - Show equations/reactions where required.
   - Explain calculations step by step.
9. If the question is incomplete or the image/text is unclear, clearly state what information is missing.
10. Mention common mistakes when useful.
11. Keep the answer suitable for Classes 9–12.
12. Do not invent facts.
13. End with a clearly marked "Final Answer".

Student should understand the solution, not merely copy it.
`;

    const model = "gemini-3.5-flash-lite";

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
        ],

        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 3000
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!answer) {
      return res.status(500).json({
        error: "Gemini returned an empty answer."
      });
    }

    return res.status(200).json({
      success: true,
      subject: subject || "General",
      answer: answer
    });

  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      error: "Something went wrong while solving the doubt."
    });
  }
}