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
        error: "Gemini API key is not configured."
      });
    }

    const prompt = `
You are the AI teacher for Invincible Coaching Classes.

Subject: ${subject || "General"}

Student Question:
${question}

Teaching rules:
1. Assume the student may have zero prior knowledge.
2. Explain in very simple language.
3. Do not simply give the final answer.
4. Explain the reasoning step-by-step.
5. For numerical questions use:
   Given
   Find
   Formula
   Substitution
   Calculation
   Final Answer
6. For Mathematics, show important calculation steps.
7. For Physics, explain formulas, units and physical meaning.
8. For Chemistry, explain the concept and reasoning clearly.
9. Use examples when useful.
10. Make the final answer clearly visible.
11. If information is missing, tell the student what is missing.
12. Keep the explanation suitable for school students.

Answer like a clear and patient teacher.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
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
            temperature: 0.3,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);

      return res.status(500).json({
        error:
          data?.error?.message ||
          "Gemini could not solve the question."
      });
    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return res.status(500).json({
        error: "No answer was received from Gemini."
      });
    }

    return res.status(200).json({
      answer: answer
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Something went wrong while solving the doubt."
    });
  }
}