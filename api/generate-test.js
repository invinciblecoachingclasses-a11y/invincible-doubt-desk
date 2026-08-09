// api/generate-test.js

export default async function handler(req, res) {
  // ------------------------------------------------------------
  // BASIC CORS
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // API KEY
  // ------------------------------------------------------------
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "GEMINI_API_KEY is not configured on Vercel."
    });
  }

  // ------------------------------------------------------------
  // READ REQUEST
  // ------------------------------------------------------------
  try {
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

    const count =
      Number(body.count || body.numberOfQuestions || 20);

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

    // ----------------------------------------------------------
    // SAFETY LIMIT
    // ----------------------------------------------------------
    const questionCount = Math.min(
      Math.max(count, 1),
      50
    );

    // ----------------------------------------------------------
    // PROMPT
    // ----------------------------------------------------------
    const prompt = `
You are an expert CBSE school teacher and question-paper creator.

Create a high-quality practice test for:

Class: ${className}
Subject: ${subject}
Chapter: ${chapter}
Number of questions: ${questionCount}
Difficulty: ${difficulty}
Language: ${language}
Question type: ${questionType}

IMPORTANT RULES:

1. Generate EXACTLY ${questionCount} questions.
2. Questions must be appropriate for ${className}.
3. Questions must be strictly related to the chapter "${chapter}".
4. Follow CBSE/NCERT-style conceptual understanding.
5. Avoid ambiguous questions.
6. Avoid duplicate questions.
7. For MCQs, every question must have exactly FOUR options.
8. There must be exactly ONE correct answer.
9. Include a short explanation for every answer.
10. If the language is bilingual, write the question and options in English + Hindi.
11. Do NOT include markdown.
12. Do NOT include introductory text.
13. Do NOT include concluding text.
14. Return ONLY one valid JSON object.

The required JSON structure is:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": 0,
      "explanation": "Short explanation"
    }
  ]
}

IMPORTANT:
- correctAnswer MUST be a NUMBER.
- 0 = Option A
- 1 = Option B
- 2 = Option C
- 3 = Option D

Return ONLY the JSON object.
`;

    // ----------------------------------------------------------
    // GEMINI 3.5 FLASH-LITE
    // ----------------------------------------------------------
    const model = "gemini-3.5-flash-lite";

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const googleResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
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
        ]
      })
    });

    // ----------------------------------------------------------
    // READ GEMINI RESPONSE
    // ----------------------------------------------------------
    const rawText = await googleResponse.text();

    let geminiData;

    try {
      geminiData = JSON.parse(rawText);
    } catch (parseError) {
      return res.status(502).json({
        success: false,
        error: "Gemini returned an invalid API response.",
        details: rawText.substring(0, 2000)
      });
    }

    // ----------------------------------------------------------
    // HANDLE GEMINI API ERROR
    // ----------------------------------------------------------
    if (!googleResponse.ok) {
      const message =
        geminiData?.error?.message ||
        "Gemini API request failed.";

      return res.status(googleResponse.status).json({
        success: false,
        error: message,
        model
      });
    }

    // ----------------------------------------------------------
    // EXTRACT GENERATED TEXT
    // ----------------------------------------------------------
    const candidates =
      geminiData?.candidates || [];

    if (!candidates.length) {
      return res.status(502).json({
        success: false,
        error: "Gemini returned no candidates.",
        raw: geminiData
      });
    }

    let generatedText = "";

    for (const candidate of candidates) {
      const parts =
        candidate?.content?.parts || [];

      for (const part of parts) {
        if (typeof part?.text === "string") {
          generatedText += part.text;
        }
      }
    }

    generatedText = generatedText.trim();

    if (!generatedText) {
      return res.status(502).json({
        success: false,
        error: "Gemini returned empty text.",
        finishReason:
          candidates?.[0]?.finishReason || null
      });
    }

    // ------------------------------------------------------------
    // CLEAN POSSIBLE MARKDOWN CODE FENCES
    // ------------------------------------------------------------
    function cleanJsonText(text) {
      let cleaned = text.trim();

      cleaned = cleaned
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      return cleaned;
    }

    generatedText = cleanJsonText(generatedText);

    // ------------------------------------------------------------
    // PARSE JSON
    // ------------------------------------------------------------
    let result;

    try {
      result = JSON.parse(generatedText);
    } catch (firstError) {
      // --------------------------------------------------------
      // FALLBACK:
      // FIND THE FIRST JSON OBJECT IN THE RESPONSE
      // --------------------------------------------------------
      const firstBrace =
        generatedText.indexOf("{");

      const lastBrace =
        generatedText.lastIndexOf("}");

      if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
      ) {
        const possibleJson =
          generatedText.substring(
            firstBrace,
            lastBrace + 1
          );

        try {
          result = JSON.parse(possibleJson);
        } catch (secondError) {
          return res.status(502).json({
            success: false,
            error: "AI generated text, but it was not valid JSON.",
            raw: generatedText.substring(0, 5000)
          });
        }
      } else {
        return res.status(502).json({
          success: false,
          error: "AI did not return a JSON object.",
          raw: generatedText.substring(0, 5000)
        });
      }
    }

    // ------------------------------------------------------------
    // GET QUESTIONS
    // ------------------------------------------------------------
    let questions = [];

    if (Array.isArray(result)) {
      questions = result;
    } else if (Array.isArray(result.questions)) {
      questions = result.questions;
    } else if (Array.isArray(result.data)) {
      questions = result.data;
    }

    // ------------------------------------------------------------
    // VALIDATE QUESTIONS
    // ------------------------------------------------------------
    if (!questions.length) {
      return res.status(502).json({
        success: false,
        error: "AI returned JSON but no questions were found.",
        raw: result
      });
    }

    const cleanedQuestions = [];

    for (const item of questions) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const questionText =
        item.question ||
        item.questionText ||
        item.text;

      if (
        typeof questionText !== "string" ||
        !questionText.trim()
      ) {
        continue;
      }

      let options = [];

      if (Array.isArray(item.options)) {
        options = item.options;
      } else if (Array.isArray(item.choices)) {
        options = item.choices;
      }

      options = options
        .map(option => {
          if (typeof option === "string") {
            return option.trim();
          }

          if (
            option &&
            typeof option.text === "string"
          ) {
            return option.text.trim();
          }

          return "";
        })
        .filter(Boolean);

      // --------------------------------------------------------
      // MCQ VALIDATION
      // --------------------------------------------------------
      if (questionType.toLowerCase().includes("mcq")) {
        if (options.length !== 4) {
          continue;
        }
      }

      // --------------------------------------------------------
      // CORRECT ANSWER
      // --------------------------------------------------------
      let correctAnswer =
        item.correctAnswer ??
        item.answer ??
        item.correctOption ??
        item.correct;

      // Convert A/B/C/D to 0/1/2/3
      if (typeof correctAnswer === "string") {
        const normalized =
          correctAnswer
            .trim()
            .toUpperCase();

        if (/^[ABCD]$/.test(normalized)) {
          correctAnswer =
            "ABCD".indexOf(normalized);
        } else if (/^[0-3]$/.test(normalized)) {
          correctAnswer =
            Number(normalized);
        } else {
          // Try to find exact answer text
          const answerIndex =
            options.findIndex(
              option =>
                option.toLowerCase() ===
                normalized.toLowerCase()
            );

          if (answerIndex !== -1) {
            correctAnswer = answerIndex;
          }
        }
      }

      if (
        typeof correctAnswer !== "number" ||
        !Number.isInteger(correctAnswer)
      ) {
        continue;
      }

      if (
        correctAnswer < 0 ||
        correctAnswer > 3
      ) {
        continue;
      }

      const explanation =
        typeof item.explanation === "string"
          ? item.explanation.trim()
          : "";

      cleanedQuestions.push({
        question: questionText.trim(),
        options,
        correctAnswer,
        explanation
      });
    }

    // ------------------------------------------------------------
    // FINAL VALIDATION
    // ------------------------------------------------------------
    if (!cleanedQuestions.length) {
      return res.status(502).json({
        success: false,
        error:
          "AI returned questions, but none passed validation.",
        receivedQuestions:
          Array.isArray(questions)
            ? questions.length
            : 0,
        raw: result
      });
    }

    // ------------------------------------------------------------
    // RETURN SUCCESS
    // ------------------------------------------------------------
    return res.status(200).json({
      success: true,
      model,
      class: className,
      subject,
      chapter,
      difficulty,
      language,
      questionType,
      requestedCount: questionCount,
      returnedCount: cleanedQuestions.length,
      questions: cleanedQuestions
    });

  } catch (error) {
    console.error(
      "generate-test error:",
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