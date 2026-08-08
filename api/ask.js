export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { subject, question } = req.body || {};

    // Check question
    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    // Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is not configured in Vercel."
      });
    }

    // AI teacher prompt
    const prompt = `
You are the AI teacher for Invincible Coaching Classes.

You teach students from Classes 9 to 12.

Subject: ${subject || "General"}

Student Question:
${question}

Teaching Rules:

1. Assume the student is a beginner.
2. Explain the concept in very simple language.
3. Do not directly jump to the final answer.
4. Explain the reasoning step by step.
5. For numerical questions:
   - Write Given
   - Write Required
   - Write Formula
   - Put values
   - Calculate step by step
   - Give Final Answer
6. For Mathematics, show every important calculation.
7. For Physics, explain the physical meaning of the formula.
8. For Chemistry, explain the concept before solving.
9. Use simple examples wherever useful.
10. Keep the explanation focused and classroom-friendly.
11. Use proper mathematical notation where possible.
12. At the end, give a short section called "Answer".
13. Do not mention that you are an AI.

Answer the student's question now.
`;

    // Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
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
            maxOutputTokens: 2000
          }
        })
      }
    );

    const data = await response.json();

    // Gemini error
    if (!response.ok) {
      console.error("Gemini API Error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini could not process the question."
      });
    }

    // Extract answer
    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!answer) {
      return res.status(500).json({
        error: "No answer was returned by Gemini."
      });
    }

    // Send answer to website
    return res.status(200).json({
      success: true,
      subject: subject || "General",
      answer: answer
    });

  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      error: "Something went wrong while solving the question."
    });
  }
}