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
     * IMPORTANT:
     * This project intentionally uses Gemini 3.5 Flash-Lite.
     * DO NOT change this to Gemini 2.5.
     */

    const MODEL = "gemini-3.5-flash-lite";

    /*
     * Generate the test.
     *
     * We intentionally DO NOT use responseMimeType,
     * responseSchema or responseFormat here.
     * The response is requested as JSON in the prompt
     * and then safely cleaned and parsed on the server.
     */

    const prompt = `
You are an expert CBSE/NCERT teacher and professional question-paper creator for Invincible Coaching Classes.

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

LANGUAGE RULES:

If language is English:
- Write all questions in English.
- Write all options in English.
- Write explanations in English.

If language is Hindi:
- Write all questions in Hindi using Devanagari script.
- Write all options in Hindi using Devanagari script.
- Write explanations in Hindi.
- Keep scientific and mathematical symbols correct.
- Use standard NCERT/CBSE Hindi terminology where appropriate.

If language is Bilingual, English + Hindi, or contains both English and Hindi:
- Every question MUST contain both languages.
- Put English first.
- Put Hindi immediately below it.
- Every option MUST contain both English and Hindi.
- Explanations MUST contain both English and Hindi.
- Do not create some questions only in English and some only in Hindi.

ACADEMIC RULES:

1. Follow CBSE and NCERT level appropriate to the class.
2. Questions must be strictly from the specified chapter.
3. Do not use material from unrelated chapters.
4. Generate EXACTLY ${numberOfQuestions} questions.
5. Every question must have EXACTLY four options.
6. The four options must be A, B, C and D.
7. Only ONE option must be correct.
8. Do not repeat questions.
9. Mix conceptual and application-based questions.
10. For Physics and Mathematics, include suitable numerical/problem-solving questions.
11. For Chemistry, include conceptual, reaction-based and numerical questions where appropriate.
12. Questions must be academically correct.
13. Questions must be suitable for the selected class.
14. Avoid ambiguous questions.
15. Avoid duplicate options.
16. The correct answer must actually correspond to one of the four options.
17. correctAnswer must be exactly one of:
A
B
C
D
18. Explanation must briefly explain the correct answer.
19. Do not use Markdown.
20. Do not use code fences.
21. Return ONLY one JSON object.
22. Do not add any text before or after the JSON.
23. Do not use comments inside JSON.
24. Make sure the JSON is valid.

VERY IMPORTANT:
The requested number is ${numberOfQuestions}.
You MUST return ${numberOfQuestions} complete questions.
Do not stop early.
Do not return 8 questions when asked for 10.
Do not return 14 questions when asked for 30.

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
      "question": "Question",
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
`;

    async function callGemini() {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
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
              maxOutputTokens: 30000
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

        throw new Error(
          data?.error?.message ||
          "Gemini API request failed."
        );
      }

      /*
       * Gemini can sometimes return text in multiple parts.
       * Join all text parts.
       */

      const text = (
        data?.candidates?.[0]?.content?.parts || []
      )
        .map(part => part?.text || "")
        .join("")
        .trim();

      if (!text) {
        console.error(
          "Gemini returned no text:",
          JSON.stringify(data, null, 2)
        );

        throw new Error(
          "Gemini returned no text. Please try again."
        );
      }

      return text;
    }

    /*
     * Clean Gemini output before JSON.parse().
     */

    function cleanJsonText(text) {
      let cleaned = String(text || "").trim();

      /*
       * Remove Markdown code fences if Gemini
       * accidentally adds them.
       */

      cleaned = cleaned
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      /*
       * Sometimes Gemini adds a sentence before/after JSON.
       * Extract the first complete JSON object.
       */

      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");

      if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
      ) {
        cleaned = cleaned.slice(
          firstBrace,
          lastBrace + 1
        );
      }

      return cleaned.trim();
    }

    /*
     * Parse Gemini response.
     */

    function parseGeminiTest(text) {
      const cleaned = cleanJsonText(text);

      try {
        return JSON.parse(cleaned);
      } catch (error) {
        console.error(
          "JSON parse failed."
        );

        console.error(
          "Raw Gemini response:",
          text
        );

        console.error(
          "Cleaned response:",
          cleaned
        );

        return null;
      }
    }

    /*
     * Validate questions.
     */

    function validateQuestions(test) {
      if (
        !test ||
        !Array.isArray(test.questions)
      ) {
        return null;
      }

      const validQuestions = [];

      for (
        let i = 0;
        i < test.questions.length;
        i++
      ) {
        const q = test.questions[i];

        if (!q) {
          continue;
        }

        const questionText =
          String(q.question || "").trim();

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

        if (!questionText) {
          continue;
        }

        if (options.length !== 4) {
          continue;
        }

        if (
          !["A", "B", "C", "D"].includes(
            correctAnswer
          )
        ) {
          /*
           * Handle accidental formats such as:
           * "A)"
           * "A) Option"
           * "Option A"
           */

          const match =
            correctAnswer.match(
              /(?:^|\s)([ABCD])(?:\)|\.|\s|$)/
            );

          if (match) {
            correctAnswer =
              match[1];
          }
        }

        if (
          !["A", "B", "C", "D"].includes(
            correctAnswer
          )
        ) {
          continue;
        }

        const cleanedOptions =
          options
            .slice(0, 4)
            .map(option =>
              String(option || "").trim()
            );

        if (
          cleanedOptions.some(
            option => !option
          )
        ) {
          continue;
        }

        validQuestions.push({
          id: validQuestions.length + 1,

          question:
            questionText,

          options:
            cleanedOptions,

          correctAnswer,

          explanation
        });
      }

      return validQuestions;
    }

    /*
     * Try multiple times if Gemini produces an incomplete
     * or malformed response.
     *
     * This is important for 20-30 question tests.
     */

    let finalQuestions = null;
    let lastRawResponse = "";

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `Gemini test generation attempt ${attempt}/3`
        );

        const rawResponse =
          await callGemini();

        lastRawResponse =
          rawResponse;

        const parsedTest =
          parseGeminiTest(
            rawResponse
          );

        const questions =
          validateQuestions(
            parsedTest
          );

        console.log(
          `Attempt ${attempt}: ${
            questions
              ? questions.length
              : 0
          } valid questions`
        );

        /*
         * Only accept the response if it has
         * EXACTLY the requested number.
         */

        if (
          questions &&
          questions.length ===
            numberOfQuestions
        ) {
          finalQuestions =
            questions;

          break;
        }
      } catch (error) {
        console.error(
          `Attempt ${attempt} failed:`,
          error?.message
        );
      }
    }

    /*
     * If all attempts failed, give a useful error.
     */

    if (
      !finalQuestions ||
      finalQuestions.length !==
        numberOfQuestions
    ) {
      return res.status(500).json({
        error:
          `AI could not generate exactly ${numberOfQuestions} valid questions. Please try again.`
      });
    }

    /*
     * Final clean response.
     */

    const finalTest = {
      testTitle:
        `${subject} - ${chapter} Test`,

      className,

      subject,

      chapter,

      difficulty,

      language,

      questions:
        finalQuestions
    };

    console.log(
      `SUCCESS: Generated exactly ${finalQuestions.length} questions using ${MODEL}.`
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