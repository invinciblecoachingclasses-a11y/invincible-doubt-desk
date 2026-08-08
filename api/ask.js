export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    // Get data sent by the website
    const { subject, question } = req.body || {};

    // Check question
    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    // Check Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is not configured in Vercel."
      });
    }

    // Teacher-style instruction for Gemini
    const prompt = `
You are the AI teacher for Invincible Coaching Classes.

The student is asking a ${subject || "general"} question.

Your job is to solve the question like an excellent CBSE teacher.

IMPORTANT RULES:
1. Do not simply give the final answer.
2. Explain the concept first in simple language.
3. Solve the problem step by step.
4. Show formulas clearly.
5. Explain what each symbol means when necessary.
6. For numerical questions, show:
   Given → Formula → Substitution → Calculation → Final Answer.
7. For Mathematics, show all important steps.
8. For Physics, include units and explain the physical meaning.
9. For Chemistry, explain the reaction/concept and important conditions.
10. If the student's question is unclear, ask what information is missing.
11. Keep the explanation suitable for a school/CBSE student.
12. Do not make up information.
13. Use simple English with a little Hindi/Hinglish only when it helps understanding.

Student's question:
${question}
`;

    // Send question to Gemini
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
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
      }
    );

    // Get Gemini response
    const data = await response.json();

    // Handle Gemini error
    if (!response.ok) {
      console.error("Gemini API Error:", data);

      return res.status(500).json({
        error: "Gemini could not solve the question.",
        details: data?.error?.message || "Unknown Gemini API error"
      });
    }

    // Extract AI answer
    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return res.status(500).json({
        error: "Gemini returned an empty answer."
      });
    }

    // Send answer back to website
    return res.status(200).json({
      answer: answer
    });

  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      error: "Something went wrong while solving the question."
    });
  }
}