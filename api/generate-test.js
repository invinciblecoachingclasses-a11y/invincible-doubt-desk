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
     * We intentionally use Gemini 3.6 Flash.
     *
     * Gemini 2.5 is NOT used anywhere in this code.
     */

    const model = "gemini-3.6-flash";

    /*
     * Generate the test.
     *
     * We use multiple attempts because sometimes an AI model
     * may return fewer questions than requested.
     */

    let finalTest = null;
    let lastError = null;

    for (let attempt = 1; attempt <= 3; attempt++) {

      const prompt = `
You are an expert CBSE/NCERT teacher and professional question-paper creator for Invincible Coaching Classes.

Create a bilingual student test.

The test MUST be suitable for Indian CBSE/NCERT students.

CLASS:
${className}

SUBJECT:
${subject}

CHAPTER:
${chapter}

NUMBER OF QUESTIONS REQUIRED:
${numberOfQuestions}

DIFFICULTY:
${difficulty}

QUESTION TYPE:
${questionType}

LANGUAGE REQUIREMENT:
Every question must be bilingual.

For EVERY question:
1. First write the English question.
2. Then write the Hindi translation immediately below it.
3. Both must ask exactly the same thing.

Example:

What is the SI unit of force?
बल की SI इकाई क्या है?

Options must also be bilingual.

Example:
A) Newton / न्यूटन
B) Joule / जूल
C) Watt / वाट
D) Pascal / पास्कल

EXPLANATION must also be bilingual.

Example:
Force is measured in newtons.
बल को न्यूटन में मापा जाता है।

STRICT RULES:

1. Create EXACTLY ${numberOfQuestions} questions.
2. Do NOT create ${numberOfQuestions - 1} questions.
3. Do NOT create fewer than ${numberOfQuestions} questions.
4. Do NOT create more than ${numberOfQuestions} questions.
5. Every question must have EXACTLY 4 options.
6. Every question must have EXACTLY ONE correct answer.
7. correctAnswer must contain ONLY A, B, C or D.
8. Do not repeat questions.
9. Questions must be strictly related to the specified chapter.
10. Do not include questions from another chapter.
11. Follow CBSE/NCERT academic level for the specified class.
12. Keep questions clear and student-friendly.
13. Include conceptual and application-based questions.
14. For Physics and Mathematics, include suitable numerical/problem-solving questions where appropriate.
15. For Chemistry, include conceptual, reaction-based and numerical questions where appropriate.
16. All numerical answers must be mathematically correct.
17. Check every correctAnswer carefully.
18. Hindi must be proper Devanagari Hindi.
19. English and Hindi versions must have the same meaning.
20. Options must be bilingual.
21. Explanations must be bilingual.
22. Do NOT use Markdown.
23. Do NOT use code fences.
24. Return ONLY valid JSON.
25. Do not write anything before or after the JSON.
26. The questions array MUST contain exactly ${numberOfQuestions} objects.

IMPORTANT:
Before returning the answer, internally count the questions.

The final questions array MUST have:
${numberOfQuestions} questions.

JSON STRUCTURE:

{
  "testTitle": "Bilingual ${subject} - ${chapter} Test",
  "className": "${className}",
  "subject": "${subject}",
  "chapter": "${chapter}",
  "difficulty": "${difficulty}",
  "language": "English + Hindi",
  "questions": [
    {
      "id": 1,
      "question": "English question\\nHindi question",
      "options": [
        "A) English option / Hindi option",
        "B) English option / Hindi option",
        "C) English option / Hindi option",
        "D) English option / Hindi option"
      ],
      "correctAnswer": "A",
      "explanation": "English explanation.\\nHindi explanation."
    }
  ]
}

REMEMBER:

EXACTLY ${numberOfQuestions} QUESTIONS.

NOT ${numberOfQuestions - 1}.
NOT ${numberOfQuestions + 1}.

EXACTLY ${numberOfQuestions}.

Return JSON only.
`;

      try {

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
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
                maxOutputTokens: 16000
              }
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {

          console.error(
            `Gemini API error on attempt ${attempt}:`,
            JSON.stringify(data, null, 2)
          );

          lastError =
            data?.error?.message ||
            "Gemini API request failed.";

          continue;
        }

        let text =
          data?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

        if (!text) {

          console.error(
            `Empty Gemini response on attempt ${attempt}:`,
            JSON.stringify(data, null, 2)
          );

          lastError = "Gemini returned an empty response.";

          continue;
        }

        /*
         * Sometimes an AI model may still return:
         *
         * ```json
         * {...}
         * ```
         *
         * Remove those fences safely.
         */

        text = text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        let test;

        try {

          test = JSON.parse(text);

        } catch (parseError) {

          console.error(
            `JSON parse error on attempt ${attempt}:`,
            parseError
          );

          console.error(
            "Raw Gemini response:",
            text
          );

          lastError =
            "Gemini returned invalid JSON.";

          continue;
        }

        if (
          !test ||
          !Array.isArray(test.questions)
        ) {

          lastError =
            "No questions were returned by AI.";

          continue;
        }

        /*
         * VERY IMPORTANT:
         *
         * If AI returns fewer questions,
         * do NOT accept the incomplete test.
         *
         * Retry automatically.
         */

        if (
          test.questions.length !==
          numberOfQuestions
        ) {

          console.warn(
            `Attempt ${attempt}: AI returned ${test.questions.length} questions instead of ${numberOfQuestions}. Retrying...`
          );

          lastError =
            `AI returned ${test.questions.length} questions instead of ${numberOfQuestions}.`;

          continue;
        }

        /*
         * Validate and clean every question.
         */

        const cleanedQuestions = [];

        for (
          let index = 0;
          index < test.questions.length;
          index++
        ) {

          const q = test.questions[index];

          if (!q) {
            continue;
          }

          const questionText =
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
           * Extract A/B/C/D if AI accidentally returns:
           * "A) ..."
           */

          const letterMatch =
            correctAnswer.match(
              /^[ABCD]/
            );

          if (letterMatch) {
            correctAnswer =
              letterMatch[0];
          }

          /*
           * Strict validation.
           */

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
            continue;
          }

          const cleanedOptions =
            options
              .slice(0, 4)
              .map(option =>
                String(option).trim()
              );

          if (
            cleanedOptions.some(
              option => !option
            )
          ) {
            continue;
          }

          cleanedQuestions.push({
            id: cleanedQuestions.length + 1,

            question: questionText,

            options: cleanedOptions,

            correctAnswer,

            explanation
          });
        }

        /*
         * If validation removed any questions,
         * retry instead of sending an incomplete test.
         */

        if (
          cleanedQuestions.length !==
          numberOfQuestions
        ) {

          console.warn(
            `Attempt ${attempt}: Only ${cleanedQuestions.length} valid questions remained out of ${numberOfQuestions}. Retrying...`
          );

          lastError =
            `Only ${cleanedQuestions.length} valid questions were generated.`;

          continue;
        }

        /*
         * Final test.
         */

        finalTest = {

          testTitle:
            test.testTitle ||
            `${subject} / ${chapter} Test`,

          className,

          subject,

          chapter,

          difficulty,

          language:
            "English + Hindi",

          questions:
            cleanedQuestions
        };

        /*
         * SUCCESS.
         */

        break;

      } catch (attemptError) {

        console.error(
          `Attempt ${attempt} failed:`,
          attemptError
        );

        lastError =
          attemptError?.message ||
          "Test generation attempt failed.";
      }
    }

    /*
     * If all 3 attempts failed,
     * return a clear error.
     */

    if (!finalTest) {

      return res.status(500).json({
        error:
          lastError ||
          "AI could not generate the complete test. Please try again."
      });
    }

    /*
     * Final safety check.
     */

    if (
      !Array.isArray(finalTest.questions) ||
      finalTest.questions.length !==
        numberOfQuestions
    ) {

      return res.status(500).json({
        error:
          `AI generated ${finalTest.questions?.length || 0} questions instead of ${numberOfQuestions}. Please try again.`
      });
    }

    console.log(
      `SUCCESS: Generated exactly ${finalTest.questions.length} bilingual questions for ${className} ${subject} - ${chapter}`
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