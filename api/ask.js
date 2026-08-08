export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    // Get question from website
    const { subject, question } = req.body || {};

    // Check question
    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    // Get Gemini API key from Vercel
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is not configured in Vercel."
      });
    }

    // AI Teacher instructions
    const prompt = `
You are the AI teacher for Invincible Coaching Classes.

You teach students Mathematics, Physics and Chemistry.

Subject: ${subject || "General"}

Student Question:
${question}

Teaching rules:

1. Assume the student may have very little prior knowledge.
2. Explain the concept in simple language.
3. Do not just give the final answer.
4. Explain the reasoning step by step.
5. For numerical problems:
   - Write the given information.
   - Write the required quantity.
   - Write the relevant formula.
   - Substitute values carefully.
   - Calculate step by step.
   - Give the final answer with correct unit.
6. For Mathematics, show important mathematical steps clearly.
7. For Physics, explain the physical meaning of the formula before using it.
8. For Chemistry, explain the relevant concept, reaction, equation or calculation clearly.
9. Mention common mistakes when useful.
10. Keep the explanation suitable for a school/coaching student.
11. Use simple formatting with headings and short paragraphs.
12. Never pretend that an answer is correct if the information is insufficient.
`;

    // Send question to Gemini
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" +
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
          ]
        })
      }
    );

    // Read Gemini response
    const data = await response.json();

    // Handle Gemini error
    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
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
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Something went wrong while solving the question."
    });
  }
}