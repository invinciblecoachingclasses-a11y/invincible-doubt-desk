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
      numberOfQuestions = 10,
      difficulty = "Moderate"
    } = req.body || {};

    if (!className || !subject || !chapter) {
      return res.status(400).json({
        error: "Class, subject and chapter are required."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel."
      });
    }

    const count = Math.min(
      Math.max(Number(numberOfQuestions) || 10, 5),
      30
    );

    const prompt = `
You are an expert CBSE/NCERT teacher creating a test for Invincible Coaching Classes.

Create exactly ${count} MCQ questions.

Class: ${className}
Subject: ${subject}
Chapter: ${chapter}
Difficulty: ${difficulty}

Rules:
- Questions must be appropriate for the given class.
- Questions must strictly belong to the specified chapter.
- Do not use questions from another chapter.
- Every question must have exactly 4 options.
- Only one option must be correct.
- Include conceptual and application-based questions.
- For Physics and Mathematics, include suitable numerical questions.
- For Chemistry, include suitable conceptual, reaction and numerical questions where relevant.
- Avoid duplicate questions.
- Questions must be academically correct.
- Keep language student-friendly.
- Give a short explanation for every answer.

Return ONLY JSON.
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
              role: "user",
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],

          generationConfig: {
            responseMimeType: "application/json",

            responseSchema: {
              type: "OBJECT",

              properties: {
                testTitle: {
                  type: "STRING"
                },

                questions: {
                  type: "ARRAY",

                  items: {
                    type: "OBJECT",

                    properties: {
                      id: {
                        type: "INTEGER"
                      },

                      question: {
                        type: "STRING"
                      },

                      options: {
                        type: "ARRAY",

                        items: {
                          type: "STRING"
                        }
                      },

                      correctAnswer: {
                        type: "STRING"
                      },

                      explanation: {
                        type: "STRING"
                      }
                    },

                    required: [
                      "id",
                      "question",
                      "options",
                      "correctAnswer",
                      "explanation"
                    ]
                  }
                }
              },

              required: [
                "testTitle",
                "questions"
              ]
            }
          }
        })
      }
    );

    const data = await response.json();

    console.log(
      "Gemini status:",
      response.status
    );

    if (!response.ok) {
      console.error(
        "Gemini error:",
        JSON.stringify(data, null, 2)
      );

      return res.status(500).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    const parts =
      data?.candidates?.[0]?.content?.parts || [];

    const text = parts
      .map(part => part?.text || "")
      .join("")
      .trim();

    if (!text) {
      console.error(
        "No text from Gemini:",
        JSON.stringify(data, null, 2)
      );

      return res.status(500).json({
        error: "Gemini returned no test data."
      });
    }

    let result;

    try {
      result = JSON.parse(text);
    } catch (error) {
      console.error(
        "JSON parsing failed:",
        text
      );

      return res.status(500).json({
        error: "Gemini returned invalid JSON."
      });
    }

    if (
      !result ||
      !Array.isArray(result.questions)
    ) {
      return res.status(500).json({
        error: "Gemini did not return a questions array."
      });
    }

    const questions = result.questions
      .map((q, index) => {

        if (!q) return null;

        if (
          !q.question ||
          !Array.isArray(q.options)
        ) {
          return null;
        }

        if (q.options.length !== 4) {
          return null;
        }

        let answer =
          String(
            q.correctAnswer || ""
          )
            .trim()
            .toUpperCase();

        /*
         Convert:
         A
         B
         C
         D
        */

        if (
          !["A", "B", "C", "D"].includes(answer)
        ) {
          const match =
            answer.match(/[ABCD]/);

          if (match) {
            answer = match[0];
          }
        }

        if (
          !["A", "B", "C", "D"].includes(answer)
        ) {
          return null;
        }

        return {
          id: index + 1,

          question:
            String(q.question).trim(),

          options:
            q.options.map(
              option =>
                String(option).trim()
            ),

          correctAnswer: answer,

          explanation:
            String(
              q.explanation || ""
            ).trim()
        };
      })
      .filter(Boolean);

    if (!questions.length) {
      return res.status(500).json({
        error:
          "Gemini generated a response, but no valid questions were found."
      });
    }

    return res.status(200).json({
      testTitle:
        result.testTitle ||
        `${subject} - ${chapter} Test`,

      className:
        String(className),

      subject:
        String(subject),

      chapter:
        String(chapter),

      difficulty:
        String(difficulty),

      questions
    });

  } catch (error) {

    console.error(
      "Generate test error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Something went wrong while generating the test."
    });
  }
}