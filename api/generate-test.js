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

    const requestedQuestions = Math.min(
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
     * IMPORTANT:
     * We are NOT using Gemini 2.5.
     * Current stable model.
     */
    const MODEL = "gemini-3.6-flash";

    /*
     * Generate bilingual questions.
     *
     * Existing frontend structure is preserved:
     * question
     * options
     * correctAnswer
     * explanation
     *
     * English + Hindi are placed together in the same fields,
     * so the existing HTML does not need to be changed.
     */

    const prompt = `
You are an expert CBSE/NCERT teacher and professional question-paper creator for Invincible Coaching Classes.

Create a high-quality student test.

CLASS: ${className}
SUBJECT: ${subject}
CHAPTER: ${chapter}
NUMBER OF QUESTIONS REQUIRED: ${requestedQuestions}
DIFFICULTY: ${difficulty}
QUESTION TYPE: ${questionType}

IMPORTANT LANGUAGE REQUIREMENT:

Every question must be bilingual.

First write the English version.
Then write the Hindi version.

Format:
English question
Hindi question

Every option must also be bilingual.

Example:
A) 9.8 m/s² / 9.8 मीटर/सेकंड²

Every explanation must also be bilingual.

The student should be able to understand the complete test in either English or Hindi medium.

STRICT ACADEMIC RULES:

1. Follow CBSE and NCERT level appropriate to the class.
2. Every question must be strictly from the specified chapter.
3. Do not include questions from any other chapter.
4. Generate EXACTLY ${requestedQuestions} questions.
5. Do NOT generate fewer than ${requestedQuestions} questions.
6. Every question must have EXACTLY four options.
7. Options must be A, B, C and D.
8. Only ONE option can be correct.
9. Do not repeat questions.
10. Mix conceptual and application-based questions.
11. For Physics and Mathematics, include appropriate numerical/problem-solving questions.
12. For Chemistry, include conceptual, reaction-based and numerical questions where appropriate.
13. Questions must be academically correct.
14. Use proper mathematical notation in plain text.
15. Keep wording clear and student-friendly.
16. Do not use Markdown.
17. Do not use code fences.
18. Return ONLY valid JSON.
19. Do not write anything before or after the JSON.
20. correctAnswer must contain ONLY one letter: A, B, C or D.
21. The explanation must briefly explain why the answer is correct.
22. Make sure the Hindi translation has the same meaning as the English question.
23. Do not translate scientific terms incorrectly.
24. Use standard school-level Hindi terminology.
25. If a scientific term is normally used in English in Indian classrooms, you may keep the English term in brackets.

VERY IMPORTANT:

The requested number is ${requestedQuestions}.

You MUST return:
${requestedQuestions} questions.

Do not stop early.
Do not return 8 when 10 are requested.
Do not return 14 when 30 are requested.

Before finalizing, internally check:
- Number of questions = ${requestedQuestions}
- Every question has 4 options
- Every question has exactly one correct answer
- Every question has English + Hindi
- Every option has English + Hindi
- Every explanation has English + Hindi
- All questions belong to ${chapter}

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
      "question": "English question / Hindi question",
      "options": [
        "A) English option / Hindi option",
        "B) English option / Hindi option",
        "C) English option / Hindi option",
        "D) English option / Hindi option"
      ],
      "correctAnswer": "A",
      "explanation": "English explanation / Hindi explanation"
    }
  ]
}
`;

    /*
     * Function to call Gemini
     */
    async function callGemini(extraInstruction = "") {

      const finalPrompt =
        prompt +
        "\n\n" +
        extraInstruction;

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
                    text: finalPrompt
                  }
                ]
              }
            ]
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

      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map(part => part?.text || "")
          .join("")
          .trim();

      if (!text) {
        console.error(
          "Gemini returned no text:",
          JSON.stringify(data, null, 2)
        );

        throw new Error(
          "Gemini returned an empty response."
        );
      }

      return text;
    }

    /*
     * Safely extract JSON from Gemini response.
     */
    function extractJSON(text) {

      let cleaned = String(text || "").trim();

      /*
       * Remove markdown code fences if Gemini
       * accidentally adds them.
       */
      cleaned = cleaned
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      /*
       * First try direct JSON.
       */
      try {
        return JSON.parse(cleaned);
      } catch (e) {
        // Continue with extraction.
      }

      /*
       * Find first { and last }.
       */
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");

      if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
      ) {
        const possibleJSON =
          cleaned.slice(
            firstBrace,
            lastBrace + 1
          );

        try {
          return JSON.parse(possibleJSON);
        } catch (e) {
          console.error(
            "Could not parse extracted JSON:",
            possibleJSON
          );
        }
      }

      return null;
    }

    /*
     * Validate and clean questions.
     */
    function cleanQuestions(test) {

      if (
        !test ||
        !Array.isArray(test.questions)
      ) {
        return [];
      }

      const cleaned = [];

      for (
        let i = 0;
        i < test.questions.length;
        i++
      ) {

        const q = test.questions[i];

        if (!q) {
          continue;
        }

        const question =
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

        /*
         * Extract A/B/C/D if Gemini writes
         * something like "A) Option..."
         */
        const match =
          correctAnswer.match(/[ABCD]/);

        if (match) {
          correctAnswer = match[0];
        }

        /*
         * Strict validation.
         */
        if (!question) {
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
          continue;
        }

        /*
         * Ensure all four options contain text.
         */
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

        cleaned.push({
          id: cleaned.length + 1,
          question,
          options: cleanedOptions,
          correctAnswer,
          explanation
        });
      }

      return cleaned;
    }

    /*
     * FIRST ATTEMPT
     */
    let rawText;

    try {
      rawText = await callGemini();
    } catch (error) {

      console.error(
        "First Gemini attempt failed:",
        error
      );

      return res.status(500).json({
        error:
          error?.message ||
          "Gemini could not generate the test."
      });
    }

    let test =
      extractJSON(rawText);

    let questions =
      cleanQuestions(test);

    /*
     * SECOND ATTEMPT:
     *
     * If Gemini returned invalid JSON,
     * too few questions, or malformed questions,
     * ask it again.
     */
    if (
      questions.length !==
      requestedQuestions
    ) {

      console.log(
        `First attempt returned ${questions.length}/${requestedQuestions}. Retrying.`
      );

      const retryInstruction = `
CRITICAL RETRY.

Your previous response was not acceptable.

Required questions: ${requestedQuestions}
Valid questions received: ${questions.length}

Generate the COMPLETE test again.

You MUST return exactly ${requestedQuestions} valid questions.

Each question MUST contain:
- question
- exactly 4 options
- correctAnswer
- explanation

Every question, option and explanation MUST contain both English and Hindi.

Do not return a partial test.

Return JSON only.
`;

      try {

        rawText =
          await callGemini(
            retryInstruction
          );

        test =
          extractJSON(rawText);

        questions =
          cleanQuestions(test);

      } catch (error) {

        console.error(
          "Retry failed:",
          error
        );

        return res.status(500).json({
          error:
            error?.message ||
            "Gemini could not generate the test."
        });
      }
    }

    /*
     * Final strict check.
     *
     * We do NOT silently send 8 questions
     * when the user asked for 10.
     */
    if (
      questions.length !==
      requestedQuestions
    ) {

      console.error(
        `Final question count: ${questions.length}/${requestedQuestions}`
      );

      return res.status(500).json({
        error:
          `AI generated ${questions.length} valid questions instead of ${requestedQuestions}. Please try Generate again.`
      });
    }

    /*
     * Final test object.
     */
    const finalTest = {

      testTitle:
        test?.testTitle ||
        `${subject} - ${chapter} Test / ${subject} - ${chapter} परीक्षा`,

      className,

      subject,

      chapter,

      difficulty,

      questions
    };

    console.log(
      `SUCCESS: Generated exactly ${questions.length} questions for ${className} ${subject} - ${chapter}`
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