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

    /*
     * Language:
     * English = English only
     * Hindi = Hindi only
     * Bilingual = English + Hindi
     *
     * If frontend does not send language,
     * Bilingual is used automatically.
     */

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
          "Gemini API key is not configured in Vercel."
      });
    }

    /*
     * =====================================================
     * LANGUAGE INSTRUCTION
     * =====================================================
     */

    let languageInstruction = "";

    if (language.toLowerCase() === "hindi") {

      languageInstruction = `
LANGUAGE:
Generate the complete test in Hindi.

Use natural school-level Hindi.
Use Devanagari script.
Keep standard scientific and mathematical symbols unchanged.
Where an English scientific term is commonly used in Indian classrooms,
you may include the English term in brackets.
`;

    } else if (
      language.toLowerCase() === "english"
    ) {

      languageInstruction = `
LANGUAGE:
Generate the complete test in English only.
Use clear CBSE/NCERT student-friendly English.
`;

    } else {

      languageInstruction = `
LANGUAGE:
Generate the test in BOTH English and Hindi.

Every question MUST contain both languages.

Format each question like:

"Which force attracts objects towards the Earth?
पृथ्वी वस्तुओं को अपनी ओर किस बल से आकर्षित करती है?"

Every option MUST also contain both languages.

Example:

"A) Gravitational force / गुरुत्वाकर्षण बल"
"B) Magnetic force / चुंबकीय बल"
"C) Frictional force / घर्षण बल"
"D) Electrostatic force / वैद्युतस्थैतिक बल"

Do NOT generate some questions only in English and others only in Hindi.
Every question and every option must contain both languages.
`;
    }


    /*
     * =====================================================
     * AI PROMPT
     * =====================================================
     */

    const prompt = `
You are an expert CBSE and NCERT teacher and professional test-paper creator for Invincible Coaching Classes.

Create an online student test.

CLASS: ${className}
SUBJECT: ${subject}
CHAPTER: ${chapter}
NUMBER OF QUESTIONS REQUIRED: ${numberOfQuestions}
DIFFICULTY: ${difficulty}
QUESTION TYPE: ${questionType}

${languageInstruction}

STRICT ACADEMIC RULES:

1. Follow CBSE and NCERT level appropriate to Class ${className}.

2. Every question must be strictly related to:
${chapter}

3. Do NOT include questions from unrelated chapters.

4. Generate EXACTLY ${numberOfQuestions} questions.

5. Do NOT generate fewer questions.

6. Generate exactly FOUR options for every question.

7. Only ONE option must be correct.

8. Do not repeat questions.

9. Questions must be academically accurate.

10. Questions should test actual understanding, not random facts.

11. Mix conceptual, application-based and numerical questions where appropriate.

12. For Physics:
Include suitable conceptual and numerical/problem-solving questions.

13. For Mathematics:
Include calculations, concepts and application-based questions where appropriate.

14. For Chemistry:
Include conceptual, reaction-based and numerical questions where appropriate.

15. For Class 9 and 10:
Keep questions appropriate to school/CBSE level.

16. For Class 11 and 12:
Use appropriate senior-secondary CBSE/NCERT level.

17. Avoid ambiguous questions.

18. Avoid two possible correct answers.

19. Do not use Markdown.

20. Do not use code blocks.

21. Return structured JSON only.

22. The answer field must be a NUMBER:
0 = first option
1 = second option
2 = third option
3 = fourth option

23. The answer must always correspond to the correct option.

24. Every question must contain exactly four options.

25. Every question must contain a short explanation.

26. Do not add introductory text before the JSON.

27. Do not add concluding text after the JSON.

The final output must contain exactly ${numberOfQuestions} questions.

Think carefully about every question before returning the final JSON.
`;


    /*
     * =====================================================
     * JSON SCHEMA
     * =====================================================
     *
     * This prevents the old problem where Gemini sometimes
     * returned only 8 questions instead of 10 or 14 instead
     * of 30.
     */

    const schema = {
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

          items: {

            type: "object",

            properties: {

              id: {
                type: "integer"
              },

              question: {
                type: "string"
              },

              options: {

                type: "array",

                minItems: 4,
                maxItems: 4,

                items: {
                  type: "string"
                }
              },

              answer: {
                type: "integer",
                minimum: 0,
                maximum: 3
              },

              explanation: {
                type: "string"
              }

            },

            required: [
              "id",
              "question",
              "options",
              "answer",
              "explanation"
            ]
          }
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


    /*
     * =====================================================
     * GEMINI 3.6 FLASH
     * =====================================================
     *
     * IMPORTANT:
     * Gemini 2.5 is NOT used anywhere.
     */

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
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

          systemInstruction: {
            parts: [
              {
                text: `
You are a highly accurate CBSE/NCERT question-paper generator.

Follow the requested class, subject and chapter strictly.

Never reduce the requested number of questions.

If the requested number is 10, return exactly 10.
If the requested number is 15, return exactly 15.
If the requested number is 20, return exactly 20.
If the requested number is 25, return exactly 25.
If the requested number is 30, return exactly 30.

Every question must have exactly four options.

For bilingual tests, every question and every option must be available in both English and Hindi.

Return only the requested structured data.
`
              }
            ]
          },

          generationConfig: {

            maxOutputTokens: 30000,

            responseFormat: {
              text: {
                mimeType: "application/json",
                schema: schema
              }
            }

          }

        })
      }
    );


    /*
     * =====================================================
     * READ GEMINI RESPONSE
     * =====================================================
     */

    const data = await response.json();


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


    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
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
     * =====================================================
     * PARSE JSON
     * =====================================================
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
        "Gemini response:",
        text
      );

      return res.status(500).json({
        error:
          "Gemini returned invalid test data."
      });
    }


    /*
     * =====================================================
     * VALIDATE QUESTIONS
     * =====================================================
     */

    if (
      !test ||
      !Array.isArray(test.questions)
    ) {

      return res.status(500).json({
        error:
          "No questions were returned by AI."
      });
    }


    /*
     * IMPORTANT:
     * Do NOT silently remove invalid questions.
     *
     * Previously, invalid questions were filtered out.
     * That is one reason you could receive:
     *
     * 8 questions instead of 10
     * 14 questions instead of 30
     *
     * Now we reject the complete generation if the
     * requested number is not returned.
     */

    if (
      test.questions.length !==
      numberOfQuestions
    ) {

      console.error(
        `Expected ${numberOfQuestions} questions but received ${test.questions.length}.`
      );

      return res.status(500).json({
        error:
          `AI generated ${test.questions.length} questions instead of ${numberOfQuestions}. Please generate the test again.`
      });
    }


    /*
     * =====================================================
     * CLEAN QUESTIONS
     * =====================================================
     */

    const cleanedQuestions =
      test.questions.map(function(q, index) {

        if (!q) {
          throw new Error(
            `Question ${index + 1} is missing.`
          );
        }


        if (
          typeof q.question !== "string" ||
          !q.question.trim()
        ) {

          throw new Error(
            `Question ${index + 1} has no question text.`
          );
        }


        if (
          !Array.isArray(q.options) ||
          q.options.length !== 4
        ) {

          throw new Error(
            `Question ${index + 1} does not have exactly four options.`
          );
        }


        const options =
          q.options.map(function(option) {

            return String(option || "").trim();

          });


        if (
          options.some(
            option => !option
          )
        ) {

          throw new Error(
            `Question ${index + 1} contains an empty option.`
          );
        }


        const answer =
          Number(q.answer);


        if (
          !Number.isInteger(answer) ||
          answer < 0 ||
          answer > 3
        ) {

          throw new Error(
            `Question ${index + 1} has an invalid correct answer.`
          );
        }


        return {

          id: index + 1,

          question:
            String(q.question).trim(),

          options,

          answer,

          explanation:
            String(
              q.explanation || ""
            ).trim()

        };

      });


    /*
     * =====================================================
     * FINAL RESPONSE
     * =====================================================
     *
     * This format is compatible with your CURRENT HTML.
     *
     * Your existing extractQuestions() already expects:
     *
     * question
     * options
     * answer
     *
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
        cleanedQuestions

    };


    console.log(
      `SUCCESS: Generated exactly ${cleanedQuestions.length} questions for ${className} ${subject} - ${chapter} (${language})`
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