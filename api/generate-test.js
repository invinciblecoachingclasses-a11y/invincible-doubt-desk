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
     * LANGUAGE SUPPORT
     *
     * If frontend sends language, use it.
     * If not, default to English.
     */

    const language = String(
      body.language || body.testLanguage || "English"
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

    /*
     * LANGUAGE INSTRUCTION
     */

    let languageInstruction = "";

    const lowerLanguage = language.toLowerCase();

    if (
      lowerLanguage.includes("hindi") ||
      language.includes("हिंदी") ||
      language.includes("हिन्दी")
    ) {
      languageInstruction = `
Generate the complete test in Hindi.

Use clear school-level Hindi suitable for CBSE/NCERT students.

Use standard Hindi scientific and mathematical terminology.

Where useful, keep internationally standard symbols, formulas,
units and scientific terms such as force, velocity, mass, etc.
Do not translate mathematical symbols.

The question, all four options and explanation must be in Hindi.
`;
    }

    else if (
      lowerLanguage.includes("bilingual") ||
      lowerLanguage.includes("both") ||
      language.includes("दोनों") ||
      language.includes("द्विभाषी")
    ) {
      languageInstruction = `
Generate the complete test bilingually.

For EVERY question:
English question first.
Hindi translation immediately below it.

For EVERY option:
English option followed by its Hindi translation.

The explanation must also be bilingual.

Do NOT create separate questions for English and Hindi.
Each question is ONE question containing both languages.
`;
    }

    else {
      languageInstruction = `
Generate the complete test in English.

Use clear CBSE/NCERT school-level English.
`;
    }

    /*
     * PROMPT
     */

    const prompt = `
You are an expert CBSE/NCERT teacher and professional
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

STRICT ACADEMIC RULES:

1. Follow CBSE/NCERT level appropriate for Class ${className}.

2. Every question must belong ONLY to:
${subject} — ${chapter}

3. Do not use content from unrelated chapters.

4. Create exactly ${numberOfQuestions} questions.

5. Every question must have exactly FOUR options.

6. Exactly ONE option must be correct.

7. Do not repeat questions.

8. Include a good mixture of conceptual and application-based questions.

9. For Physics and Mathematics, include suitable numerical/problem-solving questions.

10. For Chemistry, include conceptual, reaction-based and numerical questions where appropriate.

11. Questions must be academically correct.

12. Avoid ambiguous questions.

13. Keep questions suitable for actual student assessment.

14. Every question must have a short explanation.

15. Do not include markdown.

16. Do not include comments.

17. Return ONLY JSON.

18. correctAnswer MUST be one of:
A
B
C
D

19. The options must be normal strings.

20. Do not put the answer inside the option text.

IMPORTANT:
Do not return fewer than ${numberOfQuestions} questions.

Return this exact structure:

{
  "testTitle": "string",
  "className": "${className}",
  "subject": "${subject}",
  "chapter": "${chapter}",
  "difficulty": "${difficulty}",
  "language": "${language}",
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
`;

    /*
     * STRUCTURED JSON SCHEMA
     *
     * This makes Gemini much more reliable.
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
        "className",
        "subject",
        "chapter",
        "difficulty",
        "language",
        "questions"
      ]
    };

    /*
     * CALL GEMINI
     */

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
            responseSchema: responseSchema
          }
        })
      }
    );

    const data = await response.json();

    /*
     * GEMINI ERROR
     */

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

    /*
     * GET RESPONSE TEXT
     */

    const parts =
      data?.candidates?.[0]?.content?.parts || [];

    const text = parts
      .map(part => part?.text || "")
      .join("")
      .trim();

    if (!text) {
      console.error(
        "Gemini empty response:",
        JSON.stringify(data, null, 2)
      );

      return res.status(500).json({
        error:
          "Gemini returned an empty response."
      });
    }

    /*
     * PARSE JSON
     */

    let test;

    try {
      test = JSON.parse(text);
    }

    catch (error) {
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
          "Gemini returned invalid JSON."
      });
    }

    /*
     * CHECK QUESTIONS
     */

    if (
      !test ||
      !Array.isArray(test.questions)
    ) {
      console.error(
        "No question array:",
        test
      );

      return res.status(500).json({
        error:
          "AI did not return a valid question list."
      });
    }

    /*
     * NORMALIZE ANSWER
     *
     * This is the important fix.
     *
     * Gemini may return:
     *
     * A
     * A)
     * Option A
     * 0
     * 1
     * 2
     * 3
     * or even the option text.
     */

    function normalizeAnswer(answer, options) {

      if (
        answer === null ||
        answer === undefined
      ) {
        return null;
      }

      const raw =
        String(answer)
          .trim();

      if (!raw) {
        return null;
      }

      /*
       * Numeric answer
       *
       * 0 = A
       * 1 = B
       * 2 = C
       * 3 = D
       */

      if (/^[0-3]$/.test(raw)) {

        const number =
          Number(raw);

        return String.fromCharCode(
          65 + number
        );
      }

      const upper =
        raw.toUpperCase();

      /*
       * Direct letter
       */

      if (
        ["A", "B", "C", "D"]
          .includes(upper)
      ) {
        return upper;
      }

      /*
       * A)
       * A.
       * Option A
       * Answer: A
       */

      const letterMatch =
        upper.match(
          /\b([ABCD])\b/
        );

      if (letterMatch) {
        return letterMatch[1];
      }

      /*
       * Compare answer against option text
       */

      if (Array.isArray(options)) {

        const cleanAnswer =
          raw
            .replace(/^[A-D][\)\.\:\-]\s*/i, "")
            .replace(/^option\s+[A-D][\)\.\:\-]?\s*/i, "")
            .trim()
            .toLowerCase();

        for (
          let i = 0;
          i < options.length;
          i++
        ) {

          const cleanOption =
            String(options[i])
              .replace(/^[A-D][\)\.\:\-]\s*/i, "")
              .trim()
              .toLowerCase();

          if (
            cleanOption === cleanAnswer
          ) {
            return String.fromCharCode(
              65 + i
            );
          }
        }
      }

      return null;
    }

    /*
     * CLEAN QUESTIONS
     */

    const cleanedQuestions = [];

    for (
      let i = 0;
      i < test.questions.length;
      i++
    ) {

      const q =
        test.questions[i];

      if (!q) {
        continue;
      }

      const question =
        String(
          q.question ||
          q.questionText ||
          ""
        ).trim();

      if (!question) {
        continue;
      }

      let options =
        Array.isArray(q.options)
          ? q.options
          : Array.isArray(q.choices)
          ? q.choices
          : [];

      /*
       * Convert every option to string
       */

      options =
        options
          .map(option =>
            String(option || "").trim()
          )
          .filter(Boolean);

      /*
       * We need exactly 4 options.
       */

      if (options.length < 4) {
        console.warn(
          "Question skipped because it has fewer than 4 options:",
          i + 1
        );

        continue;
      }

      /*
       * Keep only first four.
       */

      options =
        options.slice(0, 4);

      /*
       * Normalize correct answer.
       */

      const correctAnswer =
        normalizeAnswer(
          q.correctAnswer ??
          q.answer ??
          q.correct ??
          q.correctOption,
          options
        );

      /*
       * If answer is still unknown,
       * try to use a numeric answer field.
       */

      let finalAnswer =
        correctAnswer;

      if (
        !finalAnswer &&
        typeof q.answerIndex === "number" &&
        q.answerIndex >= 0 &&
        q.answerIndex <= 3
      ) {

        finalAnswer =
          String.fromCharCode(
            65 + q.answerIndex
          );
      }

      /*
       * If still invalid, skip only this question.
       */

      if (
        !["A", "B", "C", "D"]
          .includes(finalAnswer)
      ) {

        console.warn(
          "Question skipped because correct answer could not be determined:",
          i + 1,
          q.correctAnswer,
          q.answer
        );

        continue;
      }

      cleanedQuestions.push({

        id:
          cleanedQuestions.length + 1,

        question,

        options,

        correctAnswer:
          finalAnswer,

        explanation:
          String(
            q.explanation || ""
          ).trim()

      });
    }

    /*
     * NO QUESTIONS AFTER CLEANING
     */

    if (
      cleanedQuestions.length === 0
    ) {

      console.error(
        "Gemini returned questions but none could be normalized.",
        JSON.stringify(test, null, 2)
      );

      return res.status(500).json({
        error:
          "AI generated questions, but their answer format could not be processed. Please try again."
      });
    }

    /*
     * IMPORTANT:
     *
     * We no longer fail simply because Gemini
     * returned slightly fewer questions.
     *
     * This prevents the old
     * "No questions were returned by AI"
     * problem.
     */

    const finalTest = {

      testTitle:
        String(
          test.testTitle ||
          `${subject} - ${chapter} Test`
        ),

      className,

      subject,

      chapter,

      difficulty,

      language,

      questions:
        cleanedQuestions

    };

    console.log(
      `Generated ${cleanedQuestions.length}/${numberOfQuestions} questions`
    );

    return res.status(200).json(
      finalTest
    );

  }

  catch (error) {

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