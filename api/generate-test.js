export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const body = req.body || {};

    const className = String(
      body.className || ""
    ).trim();

    const subject = String(
      body.subject || ""
    ).trim();

    const chapter = String(
      body.chapter || ""
    ).trim();

    const numberOfQuestions = Math.min(
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


    /* =====================================================
       GENERATE QUESTIONS IN SMALL BATCHES
       ===================================================== */

    let allQuestions = [];

    const MAX_ATTEMPTS = 8;

    let attempt = 0;


    while (
      allQuestions.length < numberOfQuestions &&
      attempt < MAX_ATTEMPTS
    ) {

      attempt++;

      const remaining =
        numberOfQuestions -
        allQuestions.length;

      /*
       * Never ask Gemini for too many questions
       * in one request.
       */

      const batchSize =
        Math.min(10, remaining);


      /*
       * Give Gemini the questions already generated
       * so it avoids repeating them.
       */

      const previousQuestions =
        allQuestions
          .map((q, index) =>
            `${index + 1}. ${q.question}`
          )
          .join("\n");


      const prompt = `

You are an expert CBSE and NCERT teacher creating a professional student test for:

Invincible Coaching Classes.

Create EXACTLY ${batchSize} NEW MCQ questions.

CLASS: ${className}
SUBJECT: ${subject}
CHAPTER: ${chapter}
DIFFICULTY: ${difficulty}

IMPORTANT:

1. Follow CBSE/NCERT level appropriate for Class ${className}.
2. Questions must strictly belong to the chapter:
   "${chapter}"
3. Do not include questions from unrelated chapters.
4. Create EXACTLY ${batchSize} questions.
5. Every question must have exactly 4 options.
6. Only ONE option must be correct.
7. Do not repeat questions.
8. Questions must be academically correct.
9. Use a mixture of conceptual and application-based questions.
10. For Mathematics and Physics, include suitable numerical/problem-solving questions.
11. For Chemistry, include suitable conceptual, reaction-based and numerical questions where appropriate.
12. Keep questions clear and student-friendly.
13. Do NOT provide explanations.
14. Do NOT use Markdown.
15. Return ONLY valid JSON.
16. Do not put the JSON inside markdown code blocks.
17. correctAnswer must contain ONLY A, B, C or D.

Previously generated questions are listed below.

DO NOT repeat them:

${previousQuestions || "None"}

Return exactly this structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "A) Option 1",
        "B) Option 2",
        "C) Option 3",
        "D) Option 4"
      ],
      "correctAnswer": "A"
    }
  ]
}

REMEMBER:

Generate EXACTLY ${batchSize} questions.
Exactly 4 options per question.
Exactly one correct answer.
JSON ONLY.
`;


      try {

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
          {
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

                temperature: 0.7,

                maxOutputTokens: 7000,

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

          continue;
        }


        const text =
          data?.candidates?.[0]
            ?.content?.parts
            ?.map(part =>
              part.text || ""
            )
            .join("")
            .trim();


        if (!text) {

          console.error(
            "Gemini returned empty response."
          );

          continue;
        }


        let parsed;


        try {

          parsed =
            JSON.parse(text);

        } catch (error) {

          console.error(
            "JSON parse error:",
            error
          );

          console.error(
            "Raw Gemini response:",
            text
          );

          continue;
        }


        const questions =
          Array.isArray(
            parsed?.questions
          )
            ? parsed.questions
            : [];


        /*
         * Validate every question.
         */

        for (
          const q of questions
        ) {

          if (
            allQuestions.length >=
            numberOfQuestions
          ) {
            break;
          }


          if (!q) {
            continue;
          }


          const questionText =
            String(
              q.question ||
              q.questionText ||
              ""
            ).trim();


          let options =
            Array.isArray(q.options)
              ? q.options
              : [];


          /*
           * Require exactly 4 options.
           */

          if (
            !questionText ||
            options.length !== 4
          ) {
            continue;
          }


          options =
            options.map(
              function(option) {

                return String(option)
                  .replace(
                    /^[A-D][\)\.\:\-]\s*/i,
                    ""
                  )
                  .trim();

              }
            );


          /*
           * Find correct answer.
           */

          let correctAnswer =
            q.correctAnswer;


          if (
            correctAnswer ===
            undefined ||
            correctAnswer ===
            null
          ) {

            correctAnswer =
              q.answer;

          }


          let answerIndex = -1;


          if (
            typeof correctAnswer ===
            "number"
          ) {

            answerIndex =
              correctAnswer;

          }


          else {

            const answerText =
              String(
                correctAnswer || ""
              )
                .trim()
                .toUpperCase();


            /*
             * Accept:
             * A
             * A)
             * A.
             * Option A
             * Answer: A
             */

            const letterMatch =
              answerText.match(
                /[ABCD]/
              );


            if (letterMatch) {

              answerIndex =
                letterMatch[0]
                  .charCodeAt(0) -
                65;

            }

            else if (
              /^[0-3]$/.test(
                answerText
              )
            ) {

              answerIndex =
                Number(answerText);

            }

          }


          if (
            answerIndex < 0 ||
            answerIndex > 3
          ) {

            continue;

          }


          /*
           * Avoid duplicate questions.
           */

          const normalizedQuestion =
            questionText
              .toLowerCase()
              .replace(
                /[^a-z0-9]+/g,
                " "
              )
              .trim();


          const duplicate =
            allQuestions.some(
              function(existing) {

                const existingText =
                  String(
                    existing.question
                  )
                    .toLowerCase()
                    .replace(
                      /[^a-z0-9]+/g,
                      " "
                    )
                    .trim();

                return (
                  existingText ===
                  normalizedQuestion
                );

              }
            );


          if (duplicate) {
            continue;
          }


          allQuestions.push({

            id:
              allQuestions.length + 1,

            question:
              questionText,

            options:
              options.slice(0, 4),

            answer:
              answerIndex,

            correctAnswer:
              String.fromCharCode(
                65 + answerIndex
              ),

            explanation:
              String(
                q.explanation || ""
              ).trim()

          });

        }


        console.log(
          `Attempt ${attempt}: Added ${questions.length} AI questions. Total valid questions: ${allQuestions.length}/${numberOfQuestions}`
        );


      } catch (batchError) {

        console.error(
          "Batch generation error:",
          batchError
        );

      }

    }


    /* =====================================================
       FINAL CHECK
       ===================================================== */

    if (
      allQuestions.length <
      numberOfQuestions
    ) {

      return res.status(500).json({

        error:
          `AI could generate only ${allQuestions.length} valid questions out of ${numberOfQuestions}. Please try generating the test again.`

      });

    }


    /*
     * Make absolutely sure we return
     * only the requested number.
     */

    allQuestions =
      allQuestions.slice(
        0,
        numberOfQuestions
      );


    /*
     * Re-number questions.
     */

    allQuestions =
      allQuestions.map(
        function(q, index) {

          return {

            id: index + 1,

            question:
              q.question,

            options:
              q.options,

            answer:
              q.answer,

            correctAnswer:
              q.correctAnswer,

            explanation:
              q.explanation

          };

        }
      );


    /* =====================================================
       FINAL TEST
       ===================================================== */

    const finalTest = {

      testTitle:
        `${subject} - ${chapter} Test`,

      className:
        className,

      subject:
        subject,

      chapter:
        chapter,

      difficulty:
        difficulty,

      questions:
        allQuestions

    };


    console.log(
      `SUCCESS: Generated exactly ${allQuestions.length}/${numberOfQuestions} questions.`
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