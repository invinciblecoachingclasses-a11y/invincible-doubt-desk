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
        parseInt(body.numberOfQuestions, 10) || 10,
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

    const language = String(
      body.language || "Bilingual"
    ).trim();

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

    /* =====================================================
       LANGUAGE
    ===================================================== */

    let languageInstruction = "";

    if (language === "Hindi") {
      languageInstruction = `
Generate the complete test in Hindi using Devanagari script.

Questions, options, explanations and test title should be in Hindi.

Keep mathematical symbols, formulas, units and standard
scientific notation correct.
`;
    }

    else if (language === "English") {
      languageInstruction = `
Generate the complete test in English.

Use clear, simple CBSE/NCERT-level English.
`;
    }

    else {
      languageInstruction = `
Generate a BILINGUAL test.

Every question must contain BOTH English and Hindi.

Example:

What is the SI unit of force?
बल की SI इकाई क्या है?

A) Newton
A) न्यूटन

B) Joule
B) जूल

C) Watt
C) वाट

D) Pascal
D) पास्कल

The Hindi and English versions must ask exactly the same thing.
Do not create separate questions for each language.
`;
    }

    /* =====================================================
       PROMPT
    ===================================================== */

    const prompt = `
You are an expert CBSE/NCERT teacher and professional
question-paper creator for Invincible Coaching Classes.

Create a high-quality student test.

Class: ${className}
Subject: ${subject}
Chapter: ${chapter}
Number of Questions: ${numberOfQuestions}
Difficulty: ${difficulty}
Question Type: ${questionType}
Language: ${language}

${languageInstruction}

STRICT RULES:

1. Follow CBSE/NCERT level appropriate for Class ${className}.

2. Every question must belong strictly to:
${subject} → ${chapter}

3. Do not use questions from unrelated chapters.

4. Generate EXACTLY ${numberOfQuestions} questions.

5. Every question must contain exactly FOUR options.

6. Only ONE option can be correct.

7. Do not repeat questions.

8. Include conceptual and application-based questions.

9. For Mathematics, include appropriate numerical/problem-solving
questions.

10. For Physics, include appropriate numerical/problem-solving
questions and conceptual questions.

11. For Chemistry, include conceptual, reaction-based and
numerical questions where appropriate.

12. Questions must be academically correct.

13. Questions must be suitable for school and coaching assessment.

14. Avoid ambiguous questions.

15. Every question must contain an explanation.

16. correctAnswer must be exactly:
A
B
C
or
D

17. Return ONLY JSON.

18. Do not return Markdown.

19. Do not return code fences.

20. Do not return fewer than ${numberOfQuestions} questions.

21. Do not return more than ${numberOfQuestions} questions.

22. Question IDs must be 1, 2, 3, 4... sequentially.

IMPORTANT:
The questions array MUST contain EXACTLY ${numberOfQuestions} questions.
`;

    /* =====================================================
       JSON SCHEMA
       IMPORTANT:
       This is responseSchema, NOT responseFormat.
    ===================================================== */

    const responseSchema = {
      type: "OBJECT",

      properties: {

        testTitle: {
          type: "STRING"
        },

        className: {
          type: "STRING"
        },

        subject: {
          type: "STRING"
        },

        chapter: {
          type: "STRING"
        },

        difficulty: {
          type: "STRING"
        },

        language: {
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
                type: "STRING",
                enum: [
                  "A",
                  "B",
                  "C",
                  "D"
                ]
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
        "className",
        "subject",
        "chapter",
        "difficulty",
        "language",
        "questions"
      ]
    };

    /* =====================================================
       GEMINI REQUEST
    ===================================================== */

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
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

            temperature: 0.3,

            maxOutputTokens: 32768,

            responseMimeType: "application/json",

            responseSchema: responseSchema

          }

        })
      }
    );

    const data = await response.json();

    /* =====================================================
       API ERROR
    ===================================================== */

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

    /* =====================================================
       GET RESPONSE
    ===================================================== */

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

    /* =====================================================
       PARSE JSON
    ===================================================== */

    let test;

    try {

      test = JSON.parse(text);

    } catch (error) {

      console.error(
        "JSON parse error:",
        error
      );

      console.error(
        "Raw Gemini response:",
        text
      );

      return res.status(500).json({
        error:
          "Gemini returned invalid JSON."
      });
    }

    /* =====================================================
       CHECK QUESTIONS
    ===================================================== */

    if (
      !test ||
      !Array.isArray(test.questions)
    ) {

      return res.status(500).json({
        error:
          "AI did not return a valid questions list."
      });
    }

    if (test.questions.length === 0) {

      return res.status(500).json({
        error:
          "AI returned zero questions."
      });
    }

    /*
     * If Gemini returns fewer questions,
     * report the actual number.
     */

    if (
      test.questions.length !==
      numberOfQuestions
    ) {

      console.error(
        "Question count mismatch:",
        {
          requested: numberOfQuestions,
          received: test.questions.length
        }
      );

      return res.status(500).json({

        error:
          `AI generated ${test.questions.length} questions instead of ${numberOfQuestions}. Please try again.`,

        requested:
          numberOfQuestions,

        received:
          test.questions.length

      });
    }

    /* =====================================================
       CLEAN QUESTIONS
    ===================================================== */

    const cleanedQuestions =
      test.questions.map(function(q, index) {

        let options =
          Array.isArray(q.options)
            ? q.options
            : [];

        options =
          options
            .slice(0, 4)
            .map(function(option) {
              return String(option || "").trim();
            });

        let correctAnswer =
          String(
            q.correctAnswer || ""
          )
            .trim()
            .toUpperCase();

        const match =
          correctAnswer.match(/[ABCD]/);

        if (match) {
          correctAnswer = match[0];
        }

        return {

          id: index + 1,

          question:
            String(
              q.question || ""
            ).trim(),

          options: options,

          correctAnswer:

            correctAnswer,

          explanation:
            String(
              q.explanation || ""
            ).trim()

        };

      });

    /* =====================================================
       FINAL VALIDATION
    ===================================================== */

    for (
      let i = 0;
      i < cleanedQuestions.length;
      i++
    ) {

      const q =
        cleanedQuestions[i];

      if (!q.question) {

        return res.status(500).json({
          error:
            `Question ${i + 1} is empty.`
        });
      }

      if (
        !Array.isArray(q.options) ||
        q.options.length !== 4
      ) {

        return res.status(500).json({
          error:
            `Question ${i + 1} does not have exactly 4 options.`
        });
      }

      if (
        !["A", "B", "C", "D"].includes(
          q.correctAnswer
        )
      ) {

        return res.status(500).json({
          error:
            `Question ${i + 1} has an invalid correct answer.`
        });
      }

    }

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */

    const finalTest = {

      testTitle:
        test.testTitle ||
        `${subject} - ${chapter} Test`,

      className:
        className,

      subject:
        subject,

      chapter:
        chapter,

      difficulty:
        difficulty,

      language:
        language,

      questions:
        cleanedQuestions

    };

    console.log(
      `SUCCESS: ${cleanedQuestions.length} questions generated for ${className} ${subject} ${chapter}`
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