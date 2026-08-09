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

    const languageRaw = String(
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
          "Gemini API key is not configured in Vercel."
      });
    }

    /*
     * ---------------------------------------------------------
     * LANGUAGE DETECTION
     * ---------------------------------------------------------
     */

    const languageLower = languageRaw.toLowerCase();

    let languageMode = "bilingual";

    if (
      languageLower.includes("hindi") ||
      languageRaw.includes("हिन्दी") ||
      languageRaw.includes("हिंदी")
    ) {
      if (
        languageLower.includes("english") ||
        languageRaw.includes("English")
      ) {
        languageMode = "bilingual";
      } else {
        languageMode = "hindi";
      }
    } else if (
      languageLower.includes("english")
    ) {
      languageMode = "english";
    }

    let languageInstruction = "";

    if (languageMode === "hindi") {
      languageInstruction = `
LANGUAGE MODE: HINDI

Generate the complete test in Hindi.

Questions must be written in Hindi.
Options must be written in Hindi.
Explanations must be written in Hindi.

Use standard academic Hindi suitable for CBSE students.

Scientific terms may include the English term in brackets where useful.
For example:
गुरुत्वाकर्षण (Gravitational force)
त्वरण (Acceleration)
बल (Force)
`;
    }

    if (languageMode === "english") {
      languageInstruction = `
LANGUAGE MODE: ENGLISH

Generate the complete test in English.

Questions must be written in English.
Options must be written in English.
Explanations must be written in English.
`;
    }

    if (languageMode === "bilingual") {
      languageInstruction = `
LANGUAGE MODE: BILINGUAL

Every question must contain BOTH languages.

Format:

English question
हिन्दी question

Every option must contain BOTH languages.

Example:

A) Force / बल
B) Energy / ऊर्जा
C) Power / शक्ति
D) Momentum / संवेग

Every explanation must contain BOTH English and Hindi.

Do NOT generate English-only questions.
Do NOT generate Hindi-only questions.
`;
    }

    /*
     * ---------------------------------------------------------
     * GEMINI MODEL
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     * We deliberately do NOT use Gemini 2.5.
     */

    const MODEL = "gemini-3.6-flash";

    const API_URL =
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    /*
     * ---------------------------------------------------------
     * HELPER: EXTRACT JSON FROM GEMINI RESPONSE
     * ---------------------------------------------------------
     */

    function extractJson(text) {
      if (!text) {
        throw new Error("Empty AI response.");
      }

      let cleaned = String(text).trim();

      /*
       * Remove markdown code fences if Gemini adds them.
       */

      cleaned = cleaned
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      /*
       * First try direct JSON parsing.
       */

      try {
        return JSON.parse(cleaned);
      } catch (e) {
        // Continue below.
      }

      /*
       * Find the first JSON object.
       */

      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");

      if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
      ) {
        const possibleJson =
          cleaned.substring(
            firstBrace,
            lastBrace + 1
          );

        try {
          return JSON.parse(possibleJson);
        } catch (e) {
          throw new Error(
            "AI returned invalid JSON."
          );
        }
      }

      throw new Error(
        "AI did not return valid JSON."
      );
    }

    /*
     * ---------------------------------------------------------
     * HELPER: CALL GEMINI
     * ---------------------------------------------------------
     */

    async function callGemini(prompt) {
      const response = await fetch(
        API_URL,
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
              maxOutputTokens: 60000
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Gemini API error:",
          JSON.stringify(
            data,
            null,
            2
          )
        );

        throw new Error(
          data?.error?.message ||
          "Gemini API request failed."
        );
      }

      const parts =
        data?.candidates?.[0]?.content?.parts || [];

      const text = parts
        .map(part =>
          part?.text || ""
        )
        .join("")
        .trim();

      if (!text) {
        console.error(
          "Gemini returned no text:",
          JSON.stringify(
            data,
            null,
            2
          )
        );

        throw new Error(
          "Gemini returned an empty response."
        );
      }

      return extractJson(text);
    }

    /*
     * ---------------------------------------------------------
     * GENERATE QUESTIONS
     * ---------------------------------------------------------
     */

    async function generateQuestions(
      requestedCount,
      existingQuestions = []
    ) {
      let avoidQuestions = "";

      if (
        existingQuestions.length > 0
      ) {
        avoidQuestions = `
IMPORTANT:
These questions have already been generated.

DO NOT repeat them.

Previously generated questions:

${existingQuestions
  .map(
    (q, i) =>
      `${i + 1}. ${q.question}`
  )
  .join("\n")}
`;
      }

      const prompt = `
You are an expert CBSE and NCERT teacher and professional question-paper creator for:

INVINCIBLE COACHING CLASSES

Create a student test.

CLASS:
${className}

SUBJECT:
${subject}

CHAPTER:
${chapter}

QUESTIONS REQUIRED:
${requestedCount}

DIFFICULTY:
${difficulty}

QUESTION TYPE:
${questionType}

${languageInstruction}

STRICT ACADEMIC RULES:

1. Follow CBSE and NCERT level appropriate to the specified class.

2. Every question MUST be strictly from:
${chapter}

3. Do not include questions from any other chapter.

4. Generate EXACTLY ${requestedCount} questions.

5. Every question must have EXACTLY four options.

6. The four options must be:
A
B
C
D

7. There must be exactly ONE correct option.

8. Do not repeat questions.

9. Questions should test understanding, concepts and application.

10. For Physics and Mathematics, include appropriate numerical/problem-solving questions wherever appropriate.

11. For Chemistry, include conceptual, reaction-based and numerical questions wherever appropriate.

12. Questions must be academically correct.

13. Avoid ambiguous questions.

14. Keep questions student-friendly.

15. Do not create excessively long questions.

16. Do not use Markdown.

17. Do not use HTML.

18. Do not put the JSON inside a Markdown code block.

19. Return ONLY valid JSON.

20. correctAnswer must contain ONLY:
A
B
C
or
D

21. The explanation must briefly explain why the correct answer is correct.

22. Do not include an answer key outside the JSON.

${avoidQuestions}

RETURN EXACTLY THIS STRUCTURE:

{
  "testTitle": "string",
  "questions": [
    {
      "question": "Question text",
      "options": [
        "A) Option",
        "B) Option",
        "C) Option",
        "D) Option"
      ],
      "correctAnswer": "A",
      "explanation": "Short explanation"
    }
  ]
}

FINAL REQUIREMENT:

Return EXACTLY ${requestedCount} questions.

Return JSON ONLY.
`;

      return await callGemini(prompt);
    }

    /*
     * ---------------------------------------------------------
     * FIRST GENERATION
     * ---------------------------------------------------------
     */

    let allQuestions = [];
    let testTitle =
      `${subject} - ${chapter} Test`;

    let firstError = null;

    try {
      const firstResult =
        await generateQuestions(
          numberOfQuestions
        );

      if (
        firstResult &&
        Array.isArray(
          firstResult.questions
        )
      ) {
        allQuestions =
          firstResult.questions;

        if (
          firstResult.testTitle
        ) {
          testTitle =
            String(
              firstResult.testTitle
            ).trim();
        }
      }
    } catch (error) {
      firstError = error;

      console.error(
        "First generation failed:",
        error
      );
    }

    /*
     * ---------------------------------------------------------
     * CLEAN QUESTIONS
     * ---------------------------------------------------------
     */

    function cleanQuestions(
      questions
    ) {
      if (!Array.isArray(questions)) {
        return [];
      }

      return questions
        .map((q, index) => {
          if (!q) {
            return null;
          }

          const question =
            String(
              q.question || ""
            ).trim();

          const options =
            Array.isArray(q.options)
              ? q.options
              : [];

          let correctAnswer =
            String(
              q.correctAnswer || ""
            )
              .trim()
              .toUpperCase();

          const explanation =
            String(
              q.explanation || ""
            ).trim();

          /*
           * Extract A/B/C/D if Gemini
           * accidentally returns:
           *
           * A)
           * Option A
           * A - ...
           */

          const match =
            correctAnswer.match(
              /[ABCD]/
            );

          if (match) {
            correctAnswer =
              match[0];
          }

          /*
           * Require all four options.
           */

          if (
            !question ||
            options.length !== 4 ||
            !["A", "B", "C", "D"].includes(
              correctAnswer
            )
          ) {
            return null;
          }

          return {
            id: index + 1,

            question,

            options: options
              .slice(0, 4)
              .map(option =>
                String(option)
                  .trim()
              ),

            correctAnswer,

            explanation
          };
        })
        .filter(Boolean);
    }

    allQuestions =
      cleanQuestions(
        allQuestions
      );

    /*
     * ---------------------------------------------------------
     * AUTOMATICALLY COMPLETE MISSING QUESTIONS
     * ---------------------------------------------------------
     *
     * If Gemini gives 8 when 10 were requested,
     * generate the missing 2.
     *
     * If it gives 14 when 30 were requested,
     * generate the remaining 16.
     */

    let attempts = 0;

    while (
      allQuestions.length <
        numberOfQuestions &&
      attempts < 3
    ) {
      attempts++;

      const remaining =
        numberOfQuestions -
        allQuestions.length;

      console.log(
        `Need ${remaining} more questions. Attempt ${attempts}.`
      );

      try {
        const result =
          await generateQuestions(
            remaining,
            allQuestions
          );

        const newQuestions =
          cleanQuestions(
            result?.questions || []
          );

        /*
         * Add new questions.
         */

        for (
          const question
          of newQuestions
        ) {
          if (
            allQuestions.length >=
            numberOfQuestions
          ) {
            break;
          }

          /*
           * Basic duplicate protection.
           */

          const newText =
            question.question
              .toLowerCase()
              .replace(/\s+/g, " ")
              .trim();

          const duplicate =
            allQuestions.some(
              existing => {
                const oldText =
                  existing.question
                    .toLowerCase()
                    .replace(
                      /\s+/g,
                      " "
                    )
                    .trim();

                return (
                  oldText === newText
                );
              }
            );

          if (!duplicate) {
            allQuestions.push(
              question
            );
          }
        }
      } catch (error) {
        console.error(
          `Completion attempt ${attempts} failed:`,
          error
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * FINAL VALIDATION
     * ---------------------------------------------------------
     */

    if (
      allQuestions.length === 0
    ) {
      return res.status(500).json({
        error:
          firstError?.message ||
          "AI returned no valid questions. Please try again."
      });
    }

    /*
     * Never send more questions than requested.
     */

    allQuestions =
      allQuestions.slice(
        0,
        numberOfQuestions
      );

    /*
     * Renumber questions.
     */

    allQuestions =
      allQuestions.map(
        (question, index) => ({
          ...question,
          id: index + 1
        })
      );

    /*
     * If still short after all retries,
     * tell frontend the actual reason rather
     * than silently showing a smaller test.
     */

    if (
      allQuestions.length <
      numberOfQuestions
    ) {
      return res.status(500).json({
        error:
          `AI generated only ${allQuestions.length} valid questions out of ${numberOfQuestions}. Please try generating the test again.`
      });
    }

    /*
     * ---------------------------------------------------------
     * FINAL RESPONSE
     * ---------------------------------------------------------
     */

    const finalTest = {
      testTitle,

      className,

      subject,

      chapter,

      difficulty,

      language:
        languageMode === "hindi"
          ? "Hindi"
          : languageMode === "english"
          ? "English"
          : "Bilingual",

      questions:
        allQuestions
    };

    console.log(
      `SUCCESS: Generated exactly ${allQuestions.length}/${numberOfQuestions} questions.`
    );

    return res.status(200).json(
      finalTest
    );

  } catch (error) {
    console.error(
      "Generate test fatal error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Something went wrong while generating the test."
    });
  }
}