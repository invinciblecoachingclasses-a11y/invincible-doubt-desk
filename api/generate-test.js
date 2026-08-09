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
        error: "GEMINI_API_KEY is missing in Vercel."
      });
    }

    /*
     * IMPORTANT:
     * We are NOT using Gemini 2.5.
     * Current production model.
     */
    const MODEL = "gemini-3.6-flash";

    /*
     * EXACT JSON SCHEMA
     *
     * This forces Gemini to return:
     * - exactly the requested number of questions
     * - exactly 4 options
     * - correct answer
     * - explanation
     */
    const questionSchema = {
      type: "object",
      properties: {
        id: {
          type: "integer"
        },

        question: {
          type: "string",
          description:
            "Bilingual question. English first, then Hindi."
        },

        options: {
          type: "array",
          minItems: 4,
          maxItems: 4,
          items: {
            type: "string",
            description:
              "Bilingual option. English first, then Hindi."
          }
        },

        correctAnswer: {
          type: "string",
          enum: ["A", "B", "C", "D"]
        },

        explanation: {
          type: "string",
          description:
            "Bilingual explanation. English first, then Hindi."
        }
      },

      required: [
        "id",
        "question",
        "options",
        "correctAnswer",
        "explanation"
      ]
    };

    const responseSchema = {
      type: "object",

      properties: {
        testTitle: {
          type: "string"
        },

        className: {
          type: "string"
        },

        subject: {
          type: "string"
        },

        chapter: {
          type: "string"
        },

        difficulty: {
          type: "string"
        },

        questions: {
          type: "array",

          minItems: numberOfQuestions,
          maxItems: numberOfQuestions,

          items: questionSchema
        }
      },

      required: [
        "testTitle",
        "className",
        "subject",
        "chapter",
        "difficulty",
        "questions"
      ]
    };

    const prompt = `
You are the official AI test generator for Invincible Coaching Classes.

Create a CBSE/NCERT student test.

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

LANGUAGE REQUIREMENT:
The test must work for BOTH English-medium and Hindi-medium students.

Every question MUST be bilingual.

Write:
English question
Hindi question

Every option MUST be bilingual.

Example:
A) 9.8 m/s² / 9.8 मीटर/सेकंड²

Every explanation MUST be bilingual.

Example:
English explanation / हिंदी में व्याख्या

IMPORTANT ACADEMIC RULES:

1. Follow CBSE and NCERT level for ${className}.
2. Questions must strictly belong to the chapter "${chapter}".
3. Do not use questions from another chapter.
4. Generate EXACTLY ${numberOfQuestions} questions.
5. Never generate fewer questions.
6. Never generate more questions.
7. Every question must have exactly 4 options.
8. Options must be A, B, C and D.
9. Only one option must be correct.
10. Do not repeat questions.
11. Questions should be academically accurate.
12. Include conceptual and application-based questions.
13. For Physics and Mathematics, include suitable numerical/problem-solving questions.
14. For Chemistry, include appropriate conceptual, reaction-based and numerical questions.
15. Keep questions appropriate for the selected class.
16. Use simple, clear language.
17. Use proper Hindi scientific terminology.
18. English and Hindi versions must have exactly the same meaning.
19. correctAnswer must be exactly one of A, B, C or D.
20. The explanation must clearly explain the correct answer.
21. Do not include Markdown.
22. Do not include code fences.
23. Do not include any text outside the JSON response.

CRITICAL:
The student requested ${numberOfQuestions} questions.

Return exactly ${numberOfQuestions} questions.

If the student asks for 10, return 10.
If the student asks for 20, return 20.
If the student asks for 30, return 30.

Do NOT return 8, 14, 18 or any other number.

The final result must be a complete bilingual test.
`;

    /*
     * Use Google's CURRENT Interactions API.
     *
     * No Gemini 2.5.
     * No old response_mime_type configuration.
     */
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },

        body: JSON.stringify({
          model: MODEL,

          input: prompt,

          response_format: {
            type: "text",

            mime_type: "application/json",

            schema: responseSchema
          }
        })
      }
    );

    const data = await response.json();

    /*
     * If Google API returns an error,
     * show the REAL error instead of
     * "No questions were returned".
     */
    if (!response.ok) {
      console.error(
        "Gemini API ERROR:",
        JSON.stringify(data, null, 2)
      );

      return res.status(500).json({
        error:
          data?.error?.message ||
          data?.message ||
          "Gemini API request failed."
      });
    }

    /*
     * Interactions API normally provides
     * output_text.
     */
    let text =
      data?.output_text ||
      "";

    /*
     * Fallback in case output_text isn't present.
     */
    if (!text && Array.isArray(data?.output)) {

      for (const item of data.output) {

        if (
          item?.type === "text" &&
          typeof item?.text === "string"
        ) {
          text += item.text;
        }

        if (
          item?.content &&
          Array.isArray(item.content)
        ) {

          for (const part of item.content) {

            if (
              typeof part?.text === "string"
            ) {
              text += part.text;
            }
          }
        }
      }
    }

    text = String(text || "").trim();

    if (!text) {

      console.error(
        "Gemini returned no output:",
        JSON.stringify(data, null, 2)
      );

      return res.status(500).json({
        error:
          "Gemini returned an empty response. Please try again."
      });
    }

    /*
     * Parse JSON.
     */
    let test;

    try {

      test = JSON.parse(text);

    } catch (error) {

      console.error(
        "JSON parsing failed:",
        error
      );

      console.error(
        "Raw Gemini output:",
        text
      );

      return res.status(500).json({
        error:
          "AI returned invalid test data. Please try again."
      });
    }

    /*
     * Validate test.
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
          "AI returned an invalid test structure. Please try again."
      });
    }

    /*
     * EXACT QUESTION COUNT CHECK
     */
    if (
      test.questions.length !==
      numberOfQuestions
    ) {

      console.error(
        `Wrong question count: ${test.questions.length}/${numberOfQuestions}`
      );

      return res.status(500).json({
        error:
          `AI returned ${test.questions.length} questions instead of ${numberOfQuestions}. Please press Generate again.`
      });
    }

    /*
     * Validate every question.
     */
    const questions = [];

    for (
      let i = 0;
      i < test.questions.length;
      i++
    ) {

      const q = test.questions[i];

      if (!q) {
        return res.status(500).json({
          error:
            `Question ${i + 1} is missing. Please try again.`
        });
      }

      if (
        typeof q.question !== "string" ||
        !q.question.trim()
      ) {
        return res.status(500).json({
          error:
            `Question ${i + 1} has no question text.`
        });
      }

      if (
        !Array.isArray(q.options) ||
        q.options.length !== 4
      ) {
        return res.status(500).json({
          error:
            `Question ${i + 1}