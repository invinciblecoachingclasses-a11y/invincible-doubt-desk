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
        Number.parseInt(body.numberOfQuestions, 10) || 10,
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
        error:
          "Class, subject and chapter are required."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error:
          "GEMINI_API_KEY is missing in Vercel."
      });
    }

    /*
    ============================================================
    LANGUAGE INSTRUCTION
    ============================================================
    */

    let languageInstruction = "";

    const lowerLanguage =
      language.toLowerCase();

    if (
      lowerLanguage.includes("bilingual") ||
      language.includes("हिन्दी") ||
      language.includes("हिंदी")
    ) {
      languageInstruction = `
LANGUAGE: BILINGUAL

Every question MUST contain both English and Hindi.

Example:

What is acceleration?
त्वरण क्या है?

Every option MUST contain both English and Hindi.

A) Force / बल
B) Energy / ऊर्जा
C) Power / शक्ति
D) Momentum / संवेग

Every explanation MUST contain both English and Hindi.

Do NOT make English-only questions.
Do NOT make Hindi-only questions.
`;
    } else if (
      lowerLanguage.includes("hindi")
    ) {
      languageInstruction = `
LANGUAGE: HINDI

Write all questions in Hindi.
Write all options in Hindi.
Write all explanations in Hindi.

Use standard CBSE academic Hindi.
English scientific terms may be included in brackets when useful.
`;
    } else {
      languageInstruction = `
LANGUAGE: ENGLISH

Write all questions in English.
Write all options in English.
Write all explanations in English.
`;
    }

    /*
    ============================================================
    GEMINI MODEL
    ============================================================

    IMPORTANT:
    Gemini 2.5 is NOT used anywhere.
    */

    const model =
      "gemini-3.6-flash";

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    /*
    ============================================================
    PROMPT
    ============================================================
    */

    const prompt = `
You are an expert CBSE and NCERT teacher working for
Invincible Coaching Classes.

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

${languageInstruction}

STRICT RULES:

1. Questions must be appropriate for the specified class.

2. Questions must be strictly from the specified chapter:
${chapter}

3. Do NOT use questions from another chapter.

4. Generate EXACTLY ${numberOfQuestions} questions.

5. Every question must have exactly 4 options.

6. Options must be A, B, C and D.

7. Exactly one option must be correct.

8. Do not repeat questions.

9. Include conceptual and application-based questions.

10. For Physics and Mathematics include suitable numerical/problem-solving questions.

11. For Chemistry include suitable conceptual, reaction-based and numerical questions where appropriate.

12. Questions must be academically correct.

13. Avoid ambiguous questions.

14. Keep wording clear and student-friendly.

15. Return ONLY JSON.

16. Do not use Markdown.

17. Do not use ```json.

18. correctAnswer must be exactly one of:
A
B
C
D

19. Each explanation must explain the correct answer briefly.

IMPORTANT:
The frontend requires the property name "questions".

The final JSON MUST contain a "questions" array.

Return this exact structure:

{
  "testTitle": "${subject} - ${chapter} Test",
  "questions": [
    {
      "question": "Question",
      "options": [
        "A) Option",
        "B) Option",
        "C) Option",
        "D) Option"
      ],
      "correctAnswer": "A",
      "explanation": "Explanation"
    }
  ]
}

The questions array MUST contain exactly ${numberOfQuestions} objects.

Return JSON ONLY.
`;

    /*
    ============================================================
    CALL GEMINI
    ============================================================
    */

    const geminiResponse =
      await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "x-goog-api-key":
            apiKey
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
            maxOutputTokens: 50000
          }
        })
      });

    const data =
      await geminiResponse.json();

    /*
    ============================================================
    GEMINI API ERROR
    ============================================================
    */

    if (!geminiResponse.ok) {
      console.error(
        "GEMINI ERROR:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      return res.status(500).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    /*
    ============================================================
    GET AI TEXT
    ============================================================
    */

    const parts =
      data?.candidates?.[0]?.content?.parts;

    if (
      !Array.isArray(parts) ||
      parts.length === 0
    ) {
      console.error(
        "NO GEMINI PARTS:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      return res.status(500).json({
        error:
          "Gemini returned no content."
      });
    }

    let text = parts
      .map(
        part =>
          typeof part?.text === "string"
            ? part.text
            : ""
      )
      .join("")
      .trim();

    if (!text) {
      console.error(
        "EMPTY GEMINI TEXT:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      return res.status(500).json({
        error:
          "Gemini returned empty content."
      });
    }

    /*
    ============================================================
    CLEAN JSON
    ============================================================
    */

    text = text
      .replace(
        /^```json\s*/i,
        ""
      )
      .replace(
        /^```\s*/i,
        ""
      )
      .replace(
        /\s*```$/i,
        ""
      )
      .trim();

    /*
    ============================================================
    PARSE JSON
    ============================================================
    */

    let test;

    try {
      test = JSON.parse(text);
    } catch (parseError) {
      console.error(
        "JSON PARSE ERROR:",
        parseError
      );

      console.error(
        "RAW GEMINI TEXT:",
        text
      );

      /*
      Try extracting JSON object
      from surrounding text.
      */

      const start =
        text.indexOf("{");

      const end =
        text.lastIndexOf("}");

      if (
        start !== -1 &&
        end !== -1 &&
        end > start
      ) {
        try {
          test = JSON.parse(
            text.substring(
              start,
              end + 1
            )
          );
        } catch (secondError) {
          return res.status(500).json({
            error:
              "Gemini returned invalid test data."
          });
        }
      } else {
        return res.status(500).json({
          error:
            "Gemini returned invalid test data."
        });
      }
    }

    /*
    ============================================================
    CHECK QUESTIONS
    ============================================================
    */

    if (
      !test ||
      !Array.isArray(
        test.questions
      )
    ) {
      console.error(
        "NO QUESTIONS ARRAY:",
        JSON.stringify(
          test,
          null,
          2
        )
      );

      return res.status(500).json({
        error:
          "AI did not return a questions array."
      });
    }

    /*
    ============================================================
    CLEAN QUESTIONS
    ============================================================
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
          q.question || ""
        ).trim();

      const options =
        Array.isArray(q.options)
          ? q.options
          : [];

      let answer =
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
      Extract first A/B/C/D
      */

      const answerMatch =
        answer.match(
          /[ABCD]/
        );

      if (answerMatch) {
        answer =
          answerMatch[0];
      }

      /*
      Question must contain
      exactly 4 options.
      */

      if (
        !question ||
        options.length !== 4 ||
        !["A", "B", "C", "D"].includes(
          answer
        )
      ) {
        continue;
      }

      cleanedQuestions.push({
        id:
          cleanedQuestions.length + 1,

        question,

        options: options
          .slice(0, 4)
          .map(
            option =>
              String(option)
                .trim()
          ),

        correctAnswer:
          answer,

        explanation
      });
    }

    /*
    ============================================================
    IMPORTANT:
    DO NOT ACCEPT A PARTIAL TEST
    ============================================================
    */

    if (
      cleanedQuestions.length !==
      numberOfQuestions
    ) {
      console.error(
        `Expected ${numberOfQuestions}, received ${cleanedQuestions.length}`
      );

      return res.status(500).json({
        error:
          `AI generated ${cleanedQuestions.length} valid questions instead of ${numberOfQuestions}. Please try again.`
      });
    }

    /*
    ============================================================
    FINAL RESPONSE
    ============================================================
    */

    return res.status(200).json({
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
    });

  } catch (error) {
    console.error(
      "FATAL GENERATE TEST ERROR:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Something went wrong while generating the test."
    });
  }
}