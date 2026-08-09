export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const body = req.body || {};

    const className =
      String(body.className || "").trim();

    const subject =
      String(body.subject || "").trim();

    const chapter =
      String(body.chapter || "").trim();

    const numberOfQuestions = Math.min(
      Math.max(
        parseInt(body.numberOfQuestions, 10) || 20,
        5
      ),
      30
    );

    const difficulty =
      String(
        body.difficulty || "Moderate"
      ).trim();

    const questionType =
      String(
        body.questionType || "MCQ"
      ).trim();

    const language =
      String(
        body.language || "Bilingual"
      ).trim();


    if (!className || !subject || !chapter) {

      return res.status(400).json({
        error:
          "Class, subject and chapter are required."
      });

    }


    const apiKey =
      process.env.GEMINI_API_KEY;


    if (!apiKey) {

      return res.status(500).json({
        error:
          "Gemini API key is not configured in Vercel."
      });

    }


    /* ============================================
       LANGUAGE INSTRUCTIONS
    ============================================ */

    let languageInstruction = "";

    if (language === "Hindi") {

      languageInstruction = `
LANGUAGE:
Generate the complete test in Hindi.

Use proper Hindi Devanagari script.
Questions must be in Hindi.
All four options must be in Hindi.
Explanations must be in Hindi.
Use standard scientific and mathematical terminology commonly used in Hindi-medium Indian schools.

You may include internationally accepted symbols, formulas, units and scientific notation where necessary.
`;

    } else if (language === "English") {

      languageInstruction = `
LANGUAGE:
Generate the complete test in English.

Questions must be in English.
All four options must be in English.
Explanations must be in English.
`;

    } else {

      languageInstruction = `
LANGUAGE:
Generate a BILINGUAL test.

Every question MUST contain both languages.

First write the English question.
Immediately below it write the Hindi translation.

Example:

What is the SI unit of electric current?
विद्युत धारा की SI इकाई क्या है?

Every option MUST also contain both languages.

Example:

A) Ampere / एम्पियर
B) Volt / वोल्ट
C) Ohm / ओम
D) Watt / वाट

The explanation should also contain both English and Hindi.

Do NOT create separate questions for the two languages.
Each question is ONE question containing both languages.
`;

    }


    const prompt = `
You are an expert CBSE/NCERT teacher and professional question-paper creator for Invincible Coaching Classes.

Create a high-quality student test.

CLASS: ${className}
SUBJECT: ${subject}
CHAPTER: ${chapter}
NUMBER OF QUESTIONS: ${numberOfQuestions}
DIFFICULTY: ${difficulty}
QUESTION TYPE: ${questionType}

${languageInstruction}

STRICT ACADEMIC RULES:

1. Follow CBSE and NCERT level appropriate to the class.
2. Every question must strictly belong to the specified chapter.
3. Do not include questions from unrelated chapters.
4. Create EXACTLY ${numberOfQuestions} questions.
5. Every question must have EXACTLY four options.
6. Only ONE option can be correct.
7. Do not repeat or nearly repeat questions.
8. Include conceptual and application-based questions.
9. For Physics and Mathematics, include appropriate numerical/problem-solving questions.
10. For Chemistry, include conceptual, reaction-based and numerical questions where appropriate.
11. Questions must be academically correct.
12. Use student-friendly language.
13. Do not use Markdown.
14. Return ONLY valid JSON.
15. Do not put the JSON inside markdown code fences.
16. correctAnswer must contain ONLY one letter: A, B, C or D.
17. Each question must have a short explanation.
18. NEVER return fewer than ${numberOfQuestions} questions.
19. NEVER return more than ${numberOfQuestions} questions.
20. Every question must have exactly 4 options.
21. Make sure the number of questions in the final JSON is exactly ${numberOfQuestions}.
22. Do not stop early.
23. Check the question count before returning the JSON.

Return exactly this JSON structure:

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

IMPORTANT FINAL CHECK:

The JSON MUST contain exactly ${numberOfQuestions} question objects.

Each question MUST contain:
- question
- exactly 4 options
- correctAnswer
- explanation

correctAnswer MUST be exactly A, B, C or D.

Return JSON only.
`;


    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
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

            temperature: 0.5,

            responseMimeType:
              "application/json"

          }

        })
      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "Gemini API error:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      return res.status(500).json({

        error:
          data?.error?.message ||
          "Gemini could not generate the test."

      });

    }


    const text =
      data?.candidates?.[0]
        ?.content?.parts
        ?.map(
          part => part.text || ""
        )
        .join("")
        .trim();


    if (!text) {

      return res.status(500).json({

        error:
          "Gemini returned an empty response."

      });

    }


    let test;


    try {

      test =
        JSON.parse(text);

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
          "Gemini returned invalid test data."

      });

    }


    if (
      !test ||
      !Array.isArray(
        test.questions
      )
    ) {

      return res.status(500).json({

        error:
          "AI did not return a valid question list."

      });

    }


    if (
      test.questions.length === 0
    ) {

      return res.status(500).json({

        error:
          "AI returned zero questions."

      });

    }


    /*
     * Clean questions
     */

    const cleanedQuestions =
      test.questions
        .map(
          (q, index) => {

            if (!q) {
              return null;
            }


            const options =
              Array.isArray(
                q.options
              )
                ? q.options
                : [];


            if (
              !q.question ||
              options.length !== 4 ||
              !q.correctAnswer
            ) {

              return null;

            }


            let correctAnswer =
              String(
                q.correctAnswer
              )
                .trim()
                .toUpperCase();


            const letterMatch =
              correctAnswer.match(
                /^[ABCD]/
              );


            if (letterMatch) {

              correctAnswer =
                letterMatch[0];

            }


            if (
              ![
                "A",
                "B",
                "C",
                "D"
              ].includes(
                correctAnswer
              )
            ) {

              return null;

            }


            return {

              id:
                index + 1,

              question:
                String(
                  q.question
                ).trim(),

              options:
                options
                  .slice(0, 4)
                  .map(
                    option =>
                      String(
                        option
                      ).trim()
                  ),

              correctAnswer,

              explanation:
                String(
                  q.explanation || ""
                ).trim()

            };

          }
        )
        .filter(Boolean);


    /*
     * IMPORTANT:
     * Do not silently return a short test.
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
          `AI generated only ${cleanedQuestions.length} valid questions. Please try Generate again.`

      });

    }


    /*
     * Return exactly requested number.
     */

    const finalQuestions =
      cleanedQuestions.slice(
        0,
        numberOfQuestions
      );


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
      `Generated ${finalQuestions.length} questions | ${language} | ${className} ${subject} | ${chapter}`
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