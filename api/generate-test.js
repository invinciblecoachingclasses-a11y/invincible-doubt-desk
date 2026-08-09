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
     * LANGUAGE RULES
     */

    let languageInstruction = "";

    if (
      language.toLowerCase().includes("bilingual") ||
      language.toLowerCase().includes("english +") ||
      language.includes("हिन्दी") ||
      language.includes("हिंदी")
    ) {
      languageInstruction = `
LANGUAGE MODE: BILINGUAL

Every question MUST be written in BOTH English and Hindi.

Format:

English question
हिंदी प्रश्न

Every option MUST also be written in both languages.

Example:

A) Force / बल
B) Energy / ऊर्जा
C) Power / शक्ति
D) Work / कार्य

The explanation must also be written in both English and Hindi.

Do NOT translate scientific symbols, mathematical equations, units or standard formulae unnecessarily.
`;
    } else if (
      language.toLowerCase().includes("hindi") ||
      language.includes("हिन्दी") ||
      language.includes("हिंदी")
    ) {
      languageInstruction = `
LANGUAGE MODE: HINDI

Write the complete test in Hindi.

Questions must be in Hindi.
Options must be in Hindi.
Explanations must be in Hindi.

Use standard scientific and mathematical terminology used in Indian CBSE/NCERT Hindi-medium education.

Mathematical equations, symbols, units and universally used scientific symbols may remain in standard form.
`;
    } else {
      languageInstruction = `
LANGUAGE MODE: ENGLISH

Write the complete test in English.

Questions, options and explanations must be in clear student-friendly English.
`;
    }

    /*
     * PROMPT
     */

    const prompt = `
You are an expert CBSE and NCERT teacher and professional question-paper creator for Invincible Coaching Classes.

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

STRICT ACADEMIC RULES:

1. Follow CBSE and NCERT level appropriate to the specified class.

2. Every question must be strictly related to the specified chapter.

3. Do not include questions from unrelated chapters.

4. Generate EXACTLY ${numberOfQuestions} questions.

5. Every question must contain EXACTLY four options.

6. Only ONE option must be correct.

7. Do not repeat questions.

8. Mix conceptual, application-based and reasoning questions where appropriate.

9. For Physics and Mathematics, include appropriate numerical/problem-solving questions.

10. For Chemistry, include conceptual, reaction-based and numerical questions where appropriate.

11. Questions must be academically correct.

12. Questions must be suitable for actual school/coaching assessment.

13. Avoid ambiguous questions.

14. Avoid duplicate options.

15. Make distractor options realistic.

16. Keep explanations short but academically correct.

17. Do not use Markdown.

18. Do not use code fences.

19. Return ONLY a JSON object.

20. Do not add any introduction or text before the JSON.

21. Do not add any text after the JSON.

22. correctAnswer MUST contain exactly one letter:
A
B
C
or
D

23. The ID numbers must start at 1 and continue sequentially.

24. The final questions array MUST contain exactly ${numberOfQuestions} questions.

IMPORTANT:
Before returning the answer, internally check that:
- There are exactly ${numberOfQuestions} questions.
- Every question has exactly 4 options.
- Every question has one correct answer.
- Every correctAnswer is A, B, C or D.
- No question is duplicated.
- All questions belong to the specified chapter.
- Language requirements are followed.

Return this structure:

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
     * GEMINI 3.6 FLASH
     *
     * IMPORTANT:
     * Gemini 2.5 is NOT used anywhere.
     */

    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

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
                text: prompt
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    /*
     * GEMINI API ERROR
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
     * GET MODEL TEXT
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

      return res.status(500).json({
        error:
          "Gemini returned an empty response."
      });
    }

    /*
     * CLEAN POSSIBLE MARKDOWN
     */

    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    /*
     * EXTRACT JSON OBJECT
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

      return res.status(500).json({
        error:
          "AI returned an invalid test format."
      });
    }

    text = text.slice(
      firstBrace,
      lastBrace + 1
    );

    /*
     * PARSE JSON
     */

    let test;

    try {
      test = JSON.parse(text);
    } catch (error) {
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
          "AI returned invalid test data. Please try again."
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
        "Invalid test structure:",
        test
      );

      return res.status(500).json({
        error:
          "AI did not return a valid question list."
      });
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

      if (
        !questionText ||
        options.length !== 4
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
       * Extract A/B/C/D safely.
       */

      const match =
        correctAnswer.match(/[ABCD]/);

      if (!match) {
        continue;
      }

      correctAnswer = match[0];

      /*
       * Make sure every option exists.
       */

      const cleanOptions =
        options
          .slice(0, 4)
          .map(option =>
            String(option || "").trim()
          );

      if (
        cleanOptions.length !== 4 ||
        cleanOptions.some(
          option => !option
        )
      ) {
        continue;
      }

      cleanedQuestions.push({
        id: cleanedQuestions.length + 1,

        question:
          questionText,

        options:
          cleanOptions,

        correctAnswer,

        explanation:
          String(
            q.explanation || ""
          ).trim()
      });
    }

    /*
     * NO VALID QUESTIONS
     */

    if (
      cleanedQuestions.length === 0
    ) {
      console.error(
        "No valid questions after cleaning:",
        JSON.stringify(test, null, 2)
      );

      return res.status(500).json({
        error:
          "AI returned questions, but they were not in the required format."
      });
    }

    /*
     * IMPORTANT:
     * Do not silently return fewer questions.
     */

    if (
      cleanedQuestions.length <
      numberOfQuestions
    ) {
      console.error(
        `AI returned ${cleanedQuestions.length} valid questions instead of ${numberOfQuestions}.`
      );

      return res.status(500).json({
        error:
          `AI generated ${cleanedQuestions.length} valid questions instead of ${numberOfQuestions}. Please try again.`
      });
    }

    /*
     * TAKE EXACTLY THE REQUESTED NUMBER
     */

    const finalQuestions =
      cleanedQuestions.slice(
        0,
        numberOfQuestions
      );

    /*
     * FINAL TEST
     */

    const finalTest = {
      testTitle:
        test.testTitle ||
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
      `Generated ${finalQuestions.length}/${numberOfQuestions} questions for ${className} ${subject} - ${chapter} (${language})`
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