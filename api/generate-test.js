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
      body.language || "English"
    ).trim();

    if (!className || !subject || !chapter) {
      return res.status(400).json({
        error: "Class, subject and chapter are required."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is not configured in Vercel."
      });
    }

    /*
     * LANGUAGE
     */

    const languageLower = language.toLowerCase();

    let languageInstruction = "";

    if (
      languageLower.includes("bilingual") ||
      languageLower.includes("english +") ||
      language.includes("हिन्दी") ||
      language.includes("हिंदी")
    ) {
      languageInstruction = `
LANGUAGE: BILINGUAL

Write EVERY question in English AND Hindi.

Example:

What is the SI unit of force?
बल की SI इकाई क्या है?

Options must also be bilingual:

A) Newton / न्यूटन
B) Joule / जूल
C) Watt / वाट
D) Pascal / पास्कल

The explanation must also be bilingual.

Do not translate formulas, mathematical symbols, numerical values or SI units unnecessarily.
`;
    } else if (
      languageLower.includes("hindi")
    ) {
      languageInstruction = `
LANGUAGE: HINDI

Write the entire test in Hindi.

Questions must be in Hindi.
Options must be in Hindi.
Explanations must be in Hindi.

Use standard NCERT/CBSE Hindi-medium scientific terminology.

Keep mathematical expressions, formulas, symbols and SI units in standard form where appropriate.
`;
    } else {
      languageInstruction = `
LANGUAGE: ENGLISH

Write the entire test in clear English.

Questions, options and explanations must be in English.
`;
    }

    /*
     * MAIN PROMPT
     */

    const prompt = `
You are an expert CBSE and NCERT teacher and professional question-paper creator for Invincible Coaching Classes.

Generate a high-quality MCQ student test.

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

${languageInstruction}

STRICT RULES:

1. Follow CBSE and NCERT level appropriate to the specified class.

2. Questions must be strictly from the specified chapter.

3. Do not include content from unrelated chapters.

4. Generate EXACTLY ${numberOfQuestions} questions.

5. Every question must have EXACTLY 4 options.

6. Only ONE option can be correct.

7. Do not repeat questions.

8. Include conceptual and application-based questions.

9. For Physics and Mathematics, include appropriate numerical/problem-solving questions.

10. For Chemistry, include conceptual, reaction-based and numerical questions where appropriate.

11. Questions must be academically correct.

12. Avoid ambiguous questions.

13. Avoid duplicate options.

14. Options must be plausible distractors.

15. Explanations must be short and correct.

16. Do not use Markdown.

17. Do not use code fences.

18. Return ONLY JSON.

19. Do not write anything before the JSON.

20. Do not write anything after the JSON.

21. correctAnswer must contain ONLY:
A
B
C
or
D

22. Question IDs must start from 1 and increase sequentially.

23. The questions array MUST contain exactly ${numberOfQuestions} questions.

IMPORTANT INTERNAL CHECK:

Before returning the answer, check all of these:

- Exactly ${numberOfQuestions} questions.
- Exactly 4 options for every question.
- Exactly one correct option.
- correctAnswer is A, B, C or D.
- No duplicate questions.
- All questions belong to ${chapter}.
- Correct language mode is used.
- JSON is valid.

RETURN ONLY THIS JSON STRUCTURE:

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
`;

    /*
     * GEMINI 3.5 FLASH-LITE
     *
     * IMPORTANT:
     * Gemini 2.5 is NOT used.
     */

    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

    /*
     * We may try twice if the AI returns an incomplete test.
     */

    let finalTest = null;
    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt++) {

      try {

        const response = await fetch(apiUrl, {
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
                    text:
                      attempt === 1
                        ? prompt
                        : `
IMPORTANT RETRY.

The previous attempt did not contain the required number of valid questions.

Generate the test again.

You MUST return exactly ${numberOfQuestions} complete questions.

Each question MUST contain:
- question
- exactly 4 options
- correctAnswer
- explanation

Return ONLY valid JSON.

${prompt}
`
                  }
                ]
              }
            ],

            generationConfig: {
              maxOutputTokens: 20000
            }
          })
        });

        const data = await response.json();

        /*
         * API ERROR
         */

        if (!response.ok) {

          console.error(
            "Gemini API error:",
            JSON.stringify(data, null, 2)
          );

          lastError =
            data?.error?.message ||
            "Gemini API request failed.";

          continue;
        }

        /*
         * GET TEXT
         */

        let text =
          data?.candidates?.[0]?.content?.parts
            ?.map(part => part?.text || "")
            .join("")
            .trim();

        if (!text) {

          console.error(
            "Empty Gemini response:",
            JSON.stringify(data, null, 2)
          );

          lastError =
            "Gemini returned an empty response.";

          continue;
        }

        /*
         * REMOVE CODE FENCES IF AI ADDS THEM
         */

        text = text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        /*
         * FIND JSON OBJECT
         */

        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");

        if (
          firstBrace === -1 ||
          lastBrace === -1 ||
          lastBrace <= firstBrace
        ) {

          console.error(
            "No JSON object found:",
            text
          );

          lastError =
            "AI returned an invalid JSON response.";

          continue;
        }

        text = text.slice(
          firstBrace,
          lastBrace + 1
        );

        /*
         * PARSE JSON
         */

        let parsed;

        try {

          parsed = JSON.parse(text);

        } catch (parseError) {

          console.error(
            "JSON parse error:",
            parseError
          );

          console.error(
            "Raw Gemini response:",
            text
          );

          lastError =
            "AI returned invalid JSON.";

          continue;
        }

        /*
         * VALIDATE QUESTIONS ARRAY
         */

        if (
          !parsed ||
          !Array.isArray(parsed.questions)
        ) {

          console.error(
            "No questions array:",
            parsed
          );

          lastError =
            "AI did not return a valid questions array.";

          continue;
        }

        /*
         * CLEAN QUESTIONS
         */

        const cleanedQuestions = [];

        for (
          const q of parsed.questions
        ) {

          if (!q) {
            continue;
          }

          const question =
            String(
              q.question || ""
            ).trim();

          const rawOptions =
            Array.isArray(q.options)
              ? q.options
              : [];

          if (
            !question ||
            rawOptions.length !== 4
          ) {
            continue;
          }

          const options =
            rawOptions
              .slice(0, 4)
              .map(option =>
                String(option || "").trim()
              );

          if (
            options.length !== 4 ||
            options.some(
              option => !option
            )
          ) {
            continue;
          }

          let correctAnswer =
            String(
              q.correctAnswer || ""
            )
              .trim()
              .toUpperCase();

          /*
           * Safely extract A/B/C/D.
           */

          const answerMatch =
            correctAnswer.match(
              /^[^A-D]*([ABCD])/
            );

          if (!answerMatch) {

            const fallbackMatch =
              correctAnswer.match(
                /[ABCD]/
              );

            if (!fallbackMatch) {
              continue;
            }

            correctAnswer =
              fallbackMatch[0];

          } else {

            correctAnswer =
              answerMatch[1];

          }

          if (
            !["A", "B", "C", "D"]
              .includes(correctAnswer)
          ) {
            continue;
          }

          cleanedQuestions.push({
            id:
              cleanedQuestions.length + 1,

            question,

            options,

            correctAnswer,

            explanation:
              String(
                q.explanation || ""
              ).trim()
          });
        }

        /*
         * EXACT NUMBER CHECK
         */

        if (
          cleanedQuestions.length <
          numberOfQuestions
        ) {

          console.error(
            `Attempt ${attempt}: AI returned ${cleanedQuestions.length}/${numberOfQuestions} valid questions.`
          );

          lastError =
            `AI returned ${cleanedQuestions.length} valid questions instead of ${numberOfQuestions}.`;

          continue;
        }

        /*
         * TAKE EXACTLY REQUESTED NUMBER
         */

        const exactQuestions =
          cleanedQuestions.slice(
            0,
            numberOfQuestions
          );

        /*
         * FINAL TEST
         */

        finalTest = {

          testTitle:
            parsed.testTitle ||
            `${subject} - ${chapter} Test`,

          className,

          subject,

          chapter,

          difficulty,

          language,

          questions:
            exactQuestions
        };

        break;

      } catch (attemptError) {

        console.error(
          `Attempt ${attempt} error:`,
          attemptError
        );

        lastError =
          attemptError?.message ||
          "Generation attempt failed.";
      }
    }

    /*
     * IF BOTH ATTEMPTS FAILED
     */

    if (!finalTest) {

      return res.status(500).json({
        error:
          lastError ||
          "AI could not generate the requested test. Please try again."
      });
    }

    /*
     * FINAL SAFETY CHECK
     */

    if (
      !Array.isArray(finalTest.questions) ||
      finalTest.questions.length !==
        numberOfQuestions
    ) {

      return res.status(500).json({
        error:
          "The AI test did not contain the requested number of questions."
      });
    }

    /*
     * LOG
     */

    console.log(
      `SUCCESS: ${finalTest.questions.length}/${numberOfQuestions} questions generated using Gemini 3.5 Flash-Lite`
    );

    /*
     * SEND TO FRONTEND
     */

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