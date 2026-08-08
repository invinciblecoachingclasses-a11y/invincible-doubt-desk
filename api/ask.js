export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      subject,
      question,
      image
    } = req.body || {};

    if (!question && !image) {
      return res.status(400).json({
        error: "Please enter a question or upload a photo."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is not configured."
      });
    }

    const model =
      process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

    const prompt = `
You are a friendly school teacher for Invincible Coaching Classes.

The student wants to understand the question, not just get the answer.

Subject: ${subject || "General"}

Student Question:
${question || "Solve the question shown in the image."}

TEACHING STYLE:

1. Start directly with:
Aao Logic Samjhate Hain

2. Explain in very simple language suitable for school students.

3. Use short sentences.

4. Avoid complicated words.

5. Explain the basic idea first.

6. Then show the formula if needed.

7. Put values into the formula.

8. Show only the necessary calculation.

9. Give the final answer clearly.

10. If it is a numerical question, use this simple structure:

Aao Logic Samjhate Hain

Given:
...

Formula:
...

Putting values:
...

Answer:
...

11. If it is a theory question, explain the concept in 3–6 short points.

12. If it is mathematics, show calculations clearly.

13. If it is physics, mention the relevant formula and unit.

14. If it is chemistry, explain the concept in simple student-friendly language.

15. Add one short "Yaad Rakho" point when useful.

16. Keep the complete answer SHORT.

17. Do NOT give unnecessary background information.

18. Do NOT repeat the question.

19. Do NOT use Markdown headings.

20. Do NOT use symbols such as:
###
**
$
\\text{}
\$begin:math:display$
\\$end:math:display$

21. Do NOT write programming-like formatting.

22. Do NOT use long paragraphs.

23. Do not say "AI Teacher Solution".

24. Do not mention that you are an AI.

25. Answer like a real, patient school teacher explaining on a classroom smart board.

IMPORTANT:
The student should be able to read the complete solution comfortably on a mobile phone.

At the end write:

Final Answer: [answer]

Then:

Yaad Rakho: [one short useful point]
`;

    const parts = [
      {
        text: prompt
      }
    ];

    // Add uploaded image if available
    if (image && image.data) {
      parts.push({
        inline_data: {
          mime_type: image.mimeType || "image/jpeg",
          data: image.data
        }
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 700
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Unable to get solution from Gemini."
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
      answer
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
}