export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      className,
      subject,
      chapter,
      numberOfQuestions = 20,
      difficulty = "Moderate",
      questionType = "MCQ"
    } = req.body || {};

    if (!className || !subject || !chapter) {
      return res.status(400).json({
        error: "Class, subject and chapter are required."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is not configured."
      });
    }

    const prompt = `
You are an expert Indian school teacher and professional test-paper creator for Invincible Coaching Classes.

Create a high-quality student test using the following information:

Class: ${className}
Subject: ${subject}
Chapter: ${chapter}
Number of Questions: ${numberOfQuestions}
Difficulty: ${difficulty}
Question Type: ${questionType}

IMPORTANT RULES:

1. Follow the CBSE/NCERT level appropriate for the given class.
2. Questions must strictly belong to the given subject and chapter.
3. Do not create questions from unrelated chapters.
4. Questions must be academically correct.
5. Avoid duplicate or nearly duplicate questions.
6. Use a balanced mixture of conceptual and application-based questions.
7. For Physics and Mathematics, include numerical/problem-solving questions where appropriate.
8. For Chemistry, include conceptual, reaction-based and numerical questions where appropriate.
9. Keep language clear and student-friendly.
10. Make the test useful for actual classroom assessment.
11. Every question must have exactly one correct answer.
12. Provide the correct answer separately.
13. Provide a short explanation for every answer.
14. Do not use Markdown.
15. Return ONLY valid JSON.

Return JSON in exactly this structure:

{
  "testTitle": "string",
  "className": "string",
  "subject": "string",
  "chapter": "string",
  "difficulty": "string",
  "questions": [
    {
      "id": 1,
      "question": "string",
      "options": [
        "A) string",
        "B) string",
        "C) string",
        "D) string"
      ],
      "correctAnswer": "A",
      "explanation": "string"
    }
  ]
}

Make exactly ${numberOfQuestions} questions.
`;

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
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(500).json({
        error: "Gemini could not generate the test.",
        details: data
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: "Gemini returned an empty response."
      });
    }

    let test;

    try {
      test = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);

      return res.status(500).json({
        error: "Gemini returned invalid test data."
      });
    }

    return res.status(200).json(test);

  } catch (error) {
    console.error("Generate test error:", error);

    return res.status(500).json({
      error: "Something went wrong while generating the test."
    });
  }
}