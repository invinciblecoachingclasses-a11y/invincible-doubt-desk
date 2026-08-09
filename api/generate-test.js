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

    /*
     * Language support
     *
     * English = English test
     * Hindi = Hindi test
     * Bilingual = English + Hindi together
     */

    const language = String(
      body.language || "Bilingual"
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
          "GEMINI_API_KEY is missing in Vercel Environment Variables."
      });
    }

    /*
     * =====================================================
     * LANGUAGE INSTRUCTIONS
     * =====================================================
     */

    let languageInstruction = "";

    if (language === "Hindi") {

      languageInstruction = `
Write the complete test in Hindi.

Use Devanagari script for:
- Questions
- Options
- Explanations
- Test title

Keep scientific and mathematical symbols, formulas,
units and standard scientific terms correct.
`;

    } else if (language === "English") {

      languageInstruction = `
Write the complete test in English.

Use clear, simple CBSE/NCERT-level English.
`;

    } else {

      languageInstruction = `
Create a BILINGUAL test.

For EVERY question:
English question
Hindi translation of the same question

For EVERY option:
English option
Hindi translation of the same option

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

Do NOT create separate English and Hindi questions.
Each question must contain both languages.
`;

    }

    /*
     * =====================================================
     * PROMPT
     * =====================================================
     */

    const prompt = `
You are an expert CBSE and NCERT teacher and professional
question-paper creator for Invincible Coaching Classes.

Create a high-quality student test.

CLASS:
${className}

SUBJECT:
${subject}

CHAPTER:
${chapter}

NUMBER OF QUESTIONS:
${numberOfQuestions}

DIFFICULTY:
${difficulty}

QUESTION TYPE:
${questionType}

LANGUAGE:
${language}

${languageInstruction}

IMPORTANT ACADEMIC RULES:

1. Follow CBSE/NCERT level appropriate for Class ${className}.

2. Every question MUST belong strictly to:
${subject} → ${chapter}

3. Do not use questions from unrelated chapters.

4. Generate EXACTLY ${numberOfQuestions} questions.

5. Every question MUST contain exactly FOUR options.

6. Each question MUST have exactly ONE correct answer.

7. Do not repeat questions.

8. Include a balanced mixture of conceptual,
   application-based and reasoning questions.

9. For Mathematics:
   include appropriate numerical/problem-solving questions.

10. For Physics:
    include appropriate numerical/problem-solving questions,
    formulas and conceptual questions.

11. For Chemistry:
    include conceptual, reaction-based and numerical questions
    where appropriate.

12. Questions must be academically correct.

13. Keep questions suitable for actual school/coaching assessment.

14. Do not create unnecessarily complicated questions.

15. Avoid ambiguity.

16. Every question must have an explanation.

17. The correctAnswer MUST be exactly one of:
    A
    B
    C
    D

18. Do not use Markdown.

19. Do not use code fences.

20. Return ONLY JSON matching the supplied schema.

21. VERY IMPORTANT:
    The questions array MUST contain exactly
    ${numberOfQuestions} objects.

22. Do not stop early.

23. Do not return fewer than ${numberOfQuestions} questions.

24. Do not return more than ${numberOfQuestions} questions.

25. The question numbering must start at 1 and continue sequentially.

The test must be useful for students of Invincible Coaching Classes.
`;

    /*
     * =====================================================
     * STRICT JSON SCHEMA
     * =====================================================
     */

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

          minItems: numberOfQuestions,
          maxItems: numberOfQuestions,

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

                minItems: 4,
                maxItems: 4,

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

    /*
     * =====================================================
     * GEMINI API
     * =====================================================
     */

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

            temperature: 0.4,

            maxOutputTokens: 32768,

            responseFormat: {
              text: {
                mimeType: "application/json",
                schema: responseSchema
              }
            }

          }

        })
      }
    );

    const data = await response.json();

    /*
     * =====================================================
     * API ERROR
     * =====================================================
     */

    if (!response.ok) {

      console.error(
        "Gemini API error:",
        JSON.stringify(data, null, 2)
      );

      return res.status(500).json({
        error:
          data?.error?.message ||
          "Gemini API failed to generate the test."
      });
    }

    /*
     * =====================================================
     * GET AI RESPONSE
     * =====================================================
     */

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!text) {

      console.error(
        "Gemini returned no text:",
        JSON.stringify(data, null, 2)
      );

      return res.status(500).json({
        error:
          "Gemini returned an empty response."
      });
    }

    /*
     * =====================================================
     * PARSE JSON
     * =====================================================
     */

    let test;

    try {

      test = JSON.parse(text);

    } catch (error) {

      console.error(
        "JSON parse error:",
        error
      );

      console.error(
        "RAW GEMINI RESPONSE:",
        text
      );

      return res.status(500).json({
        error:
          "Gemini returned invalid JSON."
      });
    }

    /*
     * =====================================================
     * BASIC VALIDATION
     * =====================================================
     */

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
          "AI did not return a valid questions list."
      });
    }

    /*
     * IMPORTANT:
     * Do NOT silently accept fewer questions.
     *
     * If user asks for 30, they must get 30.
     */

    if (
      test.questions.length !==
      numberOfQuestions
    ) {

      console.error(
        `Expected ${numberOfQuestions} questions but received ${test.questions.length}`
      );

      return res.status(500).json({

        error:
          `AI generated ${test.questions.length} questions instead of ${numberOfQuestions}. Please try again.`,

        generated:
          test.questions.length,

        requested:
          numberOfQuestions
      });
    }

    /*
     * =====================================================
     * CLEAN QUESTIONS
     * =====================================================
     */

    const cleanedQuestions =
      test.questions.map(function(q, index) {

        let options =
          Array.isArray(q.options)
            ? q.options
            : [];

        /*
         * Ensure exactly 4 options.
         */

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

        /*
         * Sometimes AI may return:
         *
         * "A)"
         * "A) Newton"
         * "Option A"
         *
         * Extract A/B/C/D.
         */

        const match =
          correctAnswer.match(
            /[ABCD]/
          );

        if (match) {
          correctAnswer =
            match[0];
        }

        return {

          id:
            index + 1,

          question:
            String(
              q.question || ""
            ).trim(),

          options,

          correctAnswer,

          explanation:
            String(
              q.explanation || ""
            ).trim()

        };

      });

    /*
     * =====================================================
     * FINAL VALIDATION
     * =====================================================
     */

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
            `Question ${i + 1} is empty. Please try again.`
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

    /*
     * =====================================================
     * FINAL TEST OBJECT
     * =====================================================
     */

    const finalTest = {

      testTitle:
        test.testTitle ||
        `${subject} - ${chapter} Test`,

      className,

      subject,

      chapter,

      difficulty,

      language,

      questions:
        cleanedQuestions

    };

    console.log(
      `SUCCESS: Generated ${cleanedQuestions.length} questions`
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