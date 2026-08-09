export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const body = req.body || {};

    const className = String(body.className || "").trim();
    const subject = String(body.subject || "").trim();
    const chapter = String(body.chapter || "").trim();

    const numberOfQuestions = Math.min(
      Math.max(
        parseInt(body.numberOfQuestions, 10) || 20,
        5
      ),
      30
    );

    const difficulty = String(
      body.difficulty || "Moderate"
    ).trim();

    const questionType = String(
      body.questionType || "MCQ"
    ).trim();

    if (!className || !subject || !chapter) {
      return res.status(400).json({
        error:
          "Class, subject and chapter are required."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error:
          "Gemini API key is not configured in Vercel."
      });
    }

    const prompt = `
You are an expert CBSE/NCERT teacher and professional question-paper creator for Invincible Coaching Classes.

Create a student test.

CLASS: ${className}
SUBJECT: ${subject}
CHAPTER: ${chapter}
NUMBER OF QUESTIONS: ${numberOfQuestions}
DIFFICULTY: ${difficulty}
QUESTION TYPE: ${questionType}

STRICT RULES:

1. Follow CBSE and NCERT level appropriate to the class.
2. Every question must be strictly from the specified chapter.
3. Do not include questions from other chapters.
4. Create exactly ${numberOfQuestions} questions.
5. Every question must have exactly four options.
6. Only ONE option can be correct.
7. Do not repeat questions.
8. Mix conceptual and application-based questions.
9. For Physics and Mathematics, include appropriate numerical/problem-solving questions.
10. For Chemistry, include conceptual, reaction-based and numerical questions where appropriate.
11. Questions must be academically correct.
12. Keep wording clear and student-friendly.
13. Do not use Markdown.
14. Return ONLY valid JSON.
15. Do not put ```json or ``` around the response.
16. correctAnswer must contain ONLY one letter: A, B, C or D.
17. The explanation must briefly explain why that answer is correct.

Return exactly this JSON structure:

{
  "testTitle": "string",
  "className": "${className}",
  "subject": "${subject}",
  "chapter": "${chapter}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "options": [
        "A) Option 1",
        "B) Option 2",
        "C) Option 3",
        "D) Option 4"
      ],
      "correctAnswer": "A",
      "explanation": "Short explanation"
    }
  ]
}

Remember:
- Exactly ${numberOfQuestions} questions.
- Exactly 4 options per question.
- Exactly one correct answer.
- JSON only.
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
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        JSON.stringify(data, null, 2)
      );

      return res.status(500).json({
        error:
          data?.error?.message ||
          "Gemini could not generate the test."
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!text) {
      console.error(
        "Empty Gemini response:",
        JSON.stringify(data, null, 2)
      );

      return res.status(500).json({
        error:
          "Gemini returned an empty response."
      });
    }

    let test;

    try {
      test = JSON.parse(text);
    } catch (error) {
      console.error(
        "JSON parse error:",
        error
      );

      console.error(
        "Gemini raw response:",
        text
      );

      return res.status(500).json({
        error:
          "Gemini returned invalid test data."
      });
    }

    if (
      !test ||
      !Array.isArray(test.questions)
    ) {
      console.error(
        "Invalid test structure:",
        test
      );

      return res.status(500).json({
        error:
          "No questions were returned by AI."
      });
    }

    if (test.questions.length === 0) {
      return res.status(500).json({
        error:
          "AI returned zero questions."
      });
    }

    /*
     * Clean and validate every question
     */

    const cleanedQuestions =
      test.questions
        .map((q, index) => {

          if (!q) {
            return null;
          }

          const options =
            Array.isArray(q.options)
              ? q.options
              : [];

          if (
            !q.question ||
            options.length !== 4 ||
            !q.correctAnswer
          ) {
            return null;
          }

          let correctAnswer =
            String(
              q.correctAnswer
            )
              .trim()
              .toUpperCase();

          /*
           * If Gemini accidentally returns
           * "A) ..." or "Option A",
           * extract the letter.
           */

          const letterMatch =
            correctAnswer.match(
              /^[ABCD]/
            );

          if (letterMatch) {
            correctAnswer =
              letterMatch[0];
          }

          if (
            !["A", "B", "C", "D"].includes(
              correctAnswer
            )
          ) {
            return null;
          }

          return {
            id: index + 1,

            question:
              String(q.question).trim(),

            options:
              options
                .slice(0, 4)
                .map(option =>
                  String(option).trim()
                ),

            correctAnswer,

            explanation:
              String(
                q.explanation || ""
              ).trim()
          };
        })
        .filter(Boolean);

    if (cleanedQuestions.length === 0) {
      return res.status(500).json({
        error:
          "AI generated questions, but they were not in the required format."
      });
    }

    /*
     * Return a clean response to frontend
     */

    const finalTest = {
      testTitle:
        test.testTitle ||
        `${subject} - ${chapter} Test`,

      className,

      subject,

      chapter,

      difficulty,

      questions:
        cleanedQuestions
    };

    console.log(
      `Generated ${cleanedQuestions.length} questions for ${className} ${subject} - ${chapter}`
    );

    return res.status(200).json(
      finalTest
    );

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