// api/generate-test.js

export default async function handler(req, res) {
  // ============================================================
  // CORS
  // ============================================================

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Only POST requests are allowed."
    });
  }

  // ============================================================
  // API KEY
  // ============================================================

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "GEMINI_API_KEY is missing from Vercel."
    });
  }

  try {
    // ==========================================================
    // GET USER SETTINGS
    // ==========================================================

    const body = req.body || {};

    const className =
      body.class ||
      body.className ||
      "Class 9";

    const subject =
      body.subject ||
      "Physics";

    const chapter =
      body.chapter ||
      "Gravity";

    const requestedCount = Number(
      body.count ||
      body.numberOfQuestions ||
      20
    );

    const difficulty =
      body.difficulty ||
      "Moderate";

    const language =
      body.language ||
      "English + Hindi";

    const questionType =
      body.questionType ||
      body.type ||
      "MCQ";

    // Keep question count safe.
    const questionCount = Math.min(
      Math.max(
        Number.isFinite(requestedCount)
          ? requestedCount
          : 20,
        1
      ),
      50
    );

    // ==========================================================
    // MODEL
    // ==========================================================

    // IMPORTANT:
    // NEVER use Gemini 2.5 here.
    const MODEL = "gemini-3.5-flash-lite";

    // ==========================================================
    // STRUCTURED JSON SCHEMA
    // ==========================================================

    const responseSchema = {
      type: "OBJECT",

      properties: {
        questions: {
          type: "ARRAY",

          items: {
            type: "OBJECT",

            properties: {
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
                type: "INTEGER"
              },

              explanation: {
                type: "STRING"
              }
            },

            required: [
              "question",
              "options",
              "correctAnswer",
              "explanation"
            ]
          }
        }
      },

      required: [
        "questions"
      ]
    };

    // ==========================================================
    // PROMPT
    // ==========================================================

    const prompt = `
You are an expert Indian school teacher and CBSE question-paper creator.

Generate a practice test using the following settings.

CLASS:
${className}

SUBJECT:
${subject}

CHAPTER:
${chapter}

NUMBER OF QUESTIONS:
${questionCount}

DIFFICULTY:
${difficulty}

LANGUAGE:
${language}

QUESTION TYPE:
${questionType}

STRICT INSTRUCTIONS:

1. Generate EXACTLY ${questionCount} questions.

2. Questions must be suitable for ${className}.

3. Questions must be based ONLY on the chapter:
"${chapter}"

4. Follow CBSE/NCERT level and style.

5. Questions must test actual understanding, not random trivia.

6. Avoid duplicate questions.

7. Avoid ambiguous questions.

8. For MCQs:
   - Every question must have exactly 4 options.
   - There must be exactly one correct option.
   - correctAnswer must be 0, 1, 2, or 3.
   - 0 means first option.
   - 1 means second option.
   - 2 means third option.
   - 3 means fourth option.

9. Provide a short, educational explanation for every answer.

10. If bilingual language is selected:
    Write the question in English + Hindi.
    Write all four options in English + Hindi.

11. Use proper mathematical notation where required.

12. Numerical questions must have realistic numerical values.

13. Do not generate questions outside the selected chapter.

14. Do not include an answer outside the required fields.

15. Do not write markdown.

16. Do not write introductions.

17. Do not write conclusions.

18. Do not write anything except the requested structured response.

The response must contain exactly ${questionCount} questions.
`;

    // ==========================================================
    // GEMINI REST API
    // ==========================================================

    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      MODEL +
      ":generateContent?key=" +
      encodeURIComponent(apiKey);

    const requestBody = {
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
        responseSchema: responseSchema,

        // Do NOT add temperature.
        // Do NOT add topP.
        // Do NOT add topK.
      }
    };

    // ==========================================================
    // CALL GEMINI
    // ==========================================================

    const googleResponse = await fetch(apiUrl, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(requestBody)
    });

    const rawResponse =
      await googleResponse.text();

    let geminiData;

    try {
      geminiData =
        JSON.parse(rawResponse);
    } catch (error) {
      return res.status(502).json({
        success: false,
        error:
          "Gemini returned an invalid API response.",
        details:
          rawResponse.substring(0, 3000)
      });
    }

    // ==========================================================
    // GEMINI API ERROR
    // ==========================================================

    if (!googleResponse.ok) {
      return res.status(
        googleResponse.status
      ).json({
        success: false,
        error:
          geminiData?.error?.message ||
          "Gemini API request failed.",
        model: MODEL,
        apiError: geminiData?.error || null
      });
    }

    // ==========================================================
    // GET GENERATED TEXT
    // ==========================================================

    const candidates =
      geminiData?.candidates || [];

    if (!candidates.length) {
      return res.status(502).json({
        success: false,
        error:
          "Gemini returned no candidates.",
        model: MODEL,
        response: geminiData
      });
    }

    let generatedText = "";

    for (const candidate of candidates) {
      const parts =
        candidate?.content?.parts || [];

      for (const part of parts) {
        if (
          typeof part?.text === "string"
        ) {
          generatedText += part.text;
        }
      }
    }

    generatedText =
      generatedText.trim();

    if (!generatedText) {
      return res.status(502).json({
        success: false,
        error:
          "Gemini returned empty output.",
        model: MODEL,
        finishReason:
          candidates[0]?.finishReason ||
          null
      });
    }

    // ==========================================================
    // PARSE JSON
    // ==========================================================

    let parsed;

    try {
      parsed =
        JSON.parse(generatedText);
    } catch (error) {
      return res.status(502).json({
        success: false,
        error:
          "Gemini returned text that is not valid JSON.",
        model: MODEL,
        raw:
          generatedText.substring(0, 5000)
      });
    }

    // ==========================================================
    // GET QUESTIONS
    // ==========================================================

    const questions =
      Array.isArray(parsed?.questions)
        ? parsed.questions
        : [];

    if (!questions.length) {
      return res.status(502).json({
        success: false,
        error:
          "Gemini returned JSON but no questions were found.",
        model: MODEL,
        received:
          parsed
      });
    }

    // ==========================================================
    // VALIDATE AND CLEAN QUESTIONS
    // ==========================================================

    const validQuestions = [];

    for (
      let i = 0;
      i < questions.length;
      i++
    ) {
      const q = questions[i];

      if (
        !q ||
        typeof q !== "object"
      ) {
        continue;
      }

      const question =
        typeof q.question === "string"
          ? q.question.trim()
          : "";

      const explanation =
        typeof q.explanation === "string"
          ? q.explanation.trim()
          : "";

      let options =
        Array.isArray(q.options)
          ? q.options
          : [];

      options = options
        .map(option =>
          typeof option === "string"
            ? option.trim()
            : ""
        )
        .filter(Boolean);

      let correctAnswer =
        q.correctAnswer;

      // ========================================================
      // CONVERT A/B/C/D IF MODEL RETURNS IT
      // ========================================================

      if (
        typeof correctAnswer === "string"
      ) {
        const answer =
          correctAnswer
            .trim()
            .toUpperCase();

        if (
          answer === "A" ||
          answer === "B" ||
          answer === "C" ||
          answer === "D"
        ) {
          correctAnswer =
            "ABCD".indexOf(answer);
        } else if (
          /^[0-3]$/.test(answer)
        ) {
          correctAnswer =
            Number(answer);
        }
      }

      // ========================================================
      // MCQ VALIDATION
      // ========================================================

      if (
        questionType
          .toLowerCase()
          .includes("mcq")
      ) {
        if (options.length !== 4) {
          continue;
        }

        if (
          !Number.isInteger(
            correctAnswer
          )
        ) {
          continue;
        }

        if (
          correctAnswer < 0 ||
          correctAnswer > 3
        ) {
          continue;
        }
      }

      if (!question) {
        continue;
      }

      // ========================================================
      // ADD VALID QUESTION
      // ========================================================

      validQuestions.push({
        question,
        options,
        correctAnswer,
        explanation
      });
    }

    // ==========================================================
    // IF VALID QUESTIONS EXIST
    // ==========================================================

    if (!validQuestions.length) {
      return res.status(502).json({
        success: false,
        error:
          "Gemini returned questions, but they failed validation.",
        model: MODEL,
        receivedQuestions:
          questions.length,
        raw:
          parsed
      });
    }

    // ==========================================================
    // RETURN ONLY REQUESTED NUMBER
    // ==========================================================

    const finalQuestions =
      validQuestions.slice(
        0,
        questionCount
      );

    // ==========================================================
    // SUCCESS RESPONSE
    // ==========================================================

    return res.status(200).json({
      success: true,

      model: MODEL,

      class: className,

      subject: subject,

      chapter: chapter,

      difficulty: difficulty,

      language: language,

      questionType: questionType,

      requestedCount:
        questionCount,

      returnedCount:
        finalQuestions.length,

      questions:
        finalQuestions
    });

  } catch (error) {
    // ==========================================================
    // UNEXPECTED ERROR
    // ==========================================================

    console.error(
      "AI TEST GENERATOR ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Unexpected server error."
    });
  }
}