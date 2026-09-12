export const maxDuration = 45;

export default async function handler(req, res) {
  // CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Only POST allowed"
    });
  }

  try {
    const body = req.body || {};

    const className =
      body.className ||
      body.class ||
      "10";

    const subject =
      body.subject ||
      "Science";

    const chapter =
      body.chapter ||
      "Full Syllabus Overview";

    const requestedCount =
      Number(
        body.count ||
        body.numberOfQuestions ||
        20
      );

    const difficulty =
      body.difficulty ||
      "Moderate";

    const language =
      body.language ||
      "English and Hindi";

    // Strictly enforce question range
    const questionCount =
      Math.min(
        Math.max(requestedCount, 1),
        30
      );

    const testPrompt = `You are a senior CBSE Board Examiner creating an official exam test paper.

Generate a complete test paper containing EXACTLY ${questionCount} multiple-choice questions (MCQs).

Target Parameters:
- Class: ${className}
- Subject: ${subject}
- Chapter/Topic: ${chapter}
- Difficulty: ${difficulty}
- Language: ${language}

STRICT COUNT & FORMAT RULES:

1. ARRAY LENGTH:
The 'questions' array MUST contain EXACTLY ${questionCount} question items.
Do not stop early.

2. SUBJECT FENCE:
Stay strictly within:
${subject} - ${chapter}

Do not introduce unrelated chapters or subjects.

3. EXACTLY 4 OPTIONS:
Every question MUST contain exactly 4 choices in the 'options' array.

4. CORRECT ANSWER:
'correctAnswer' MUST be the zero-based index of the correct option.
Valid values are only 0, 1, 2, or 3.

5. CONCISE EXPLANATIONS:
Keep each explanation to 1 short sentence under 15 words.

6. UNICODE:
Use clean Unicode mathematical and scientific symbols where appropriate
(e.g. θ, λ, μ, Ω, ε, π, √, x²).

7. TOPIC METADATA:
Every question MUST contain a 'topic' field.
The topic should identify the specific chapter sub-topic/concept being tested.

Examples:
- "Linear Equations in Two Variables"
- "Acids, Bases and Salts"
- "Light Reflection"
- "Quadratic Equations"

8. CONCEPT METADATA:
Every question MUST contain a 'concept' field.
The concept should identify the precise learning concept tested by that question.

Examples:
- "Graph of a linear equation"
- "pH scale"
- "Mirror formula"
- "Nature of roots"

9. DO NOT GUESS METADATA:
Only provide topic/concept when they are genuinely supported by the question.
If a precise topic or concept cannot be determined confidently, return an empty string "".
Never invent unrelated metadata.

10. METADATA ALIGNMENT:
The topic and concept must describe what the question actually tests.
Do not simply repeat the full chapter name for every question unless the question genuinely tests the whole chapter.

11. CLEAN STRINGS:
Do NOT use raw newlines or unescaped double quotes inside string values.

12. QUALITY:
Questions must be academically meaningful, CBSE-aligned, and appropriate for Class ${className}.
Avoid duplicate questions and ambiguous options.`;

    const jsonSchema = {
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
              },

              topic: {
                type: "STRING"
              },

              concept: {
                type: "STRING"
              }
            },

            required: [
              "question",
              "options",
              "correctAnswer",
              "explanation",
              "topic",
              "concept"
            ]
          }
        }
      },

      required: [
        "questions"
      ]
    };

    function extractQuestionsFromRaw(raw) {
      if (!raw) return [];

      let clean =
        raw
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

      const firstBrace =
        clean.indexOf("{");

      const lastBrace =
        clean.lastIndexOf("}");

      if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
      ) {
        clean =
          clean.substring(
            firstBrace,
            lastBrace + 1
          );
      }

      try {
        const parsed =
          JSON.parse(clean);

        if (
          Array.isArray(
            parsed?.questions
          )
        ) {
          return parsed.questions;
        }

        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e1) {
        try {
          const sanitized =
            clean.replace(
              /[\u0000-\u001F]+/g,
              " "
            );

          const parsed =
            JSON.parse(sanitized);

          if (
            Array.isArray(
              parsed?.questions
            )
          ) {
            return parsed.questions;
          }
        } catch (e2) {
          const questions = [];

          const blockRegex =
            /\{\s*"question"\s*:\s*"((?:[^"\\]|\\.)*)"\s*[\s\S]*?"options"\s*:\s*\[([\s\S]*?)\]\s*[\s\S]*?"correctAnswer"\s*:\s*(\d+)[\s\S]*?"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;

          let match;

          while (
            (match =
              blockRegex.exec(clean)) !== null
          ) {
            try {
              const qText =
                match[1]
                  .replace(
                    /\\"/g,
                    '"'
                  );

              const rawOpts =
                match[2].match(
                  /"((?:[^"\\]|\\.)*)"/g
                ) || [];

              const opts =
                rawOpts.map(
                  o =>
                    o
                      .slice(1, -1)
                      .replace(
                        /\\"/g,
                        '"'
                      )
                      .trim()
                );

              const cAns =
                parseInt(
                  match[3],
                  10
                );

              const exp =
                match[4]
                  .replace(
                    /\\"/g,
                    '"'
                  );

              if (opts.length >= 2) {
                questions.push({
                  question: qText,
                  options: opts,
                  correctAnswer:
                    Number.isFinite(cAns)
                      ? cAns
                      : 0,
                  explanation:
                    exp ||
                    "Review NCERT concepts.",
                  topic: "",
                  concept: ""
                });
              }
            } catch (err) {}
          }

          return questions;
        }
      }

      return [];
    }

    function normalizeQuestion(q) {
      if (
        !q ||
        !q.question ||
        !Array.isArray(q.options) ||
        q.options.length < 2
      ) {
        return null;
      }

      let cIndex =
        Number(q.correctAnswer) || 0;

      if (
        cIndex < 0 ||
        cIndex >= q.options.length
      ) {
        cIndex = 0;
      }

      const indexed =
        q.options.map(
          (opt, i) => ({
            opt: String(opt),
            isCorrect:
              i === cIndex
          })
        );

      for (
        let i = indexed.length - 1;
        i > 0;
        i--
      ) {
        const j =
          Math.floor(
            Math.random() * (i + 1)
          );

        [
          indexed[i],
          indexed[j]
        ] = [
          indexed[j],
          indexed[i]
        ];
      }

      return {
        question:
          String(q.question),

        options:
          indexed.map(
            x => x.opt
          ),

        correctAnswer:
          indexed.findIndex(
            x => x.isCorrect
          ),

        explanation:
          String(
            q.explanation ||
            "Review NCERT concepts."
          ),

        topic:
          String(
            q.topic || ""
          ).trim(),

        concept:
          String(
            q.concept || ""
          ).trim()
      };
    }

    let finalQuestions = [];
    let errorLog = [];
    let usedProvider = "";

    // ==========================================
    // PHASE 1: PRIMARY PROVIDER
    // Google Gemini 3.6 Flash
    // ==========================================

    const rawGeminiKeys =
      process.env.GEMINI_API_KEYS ||
      process.env.GEMINI_API_KEY;

    if (rawGeminiKeys) {
      const geminiKeys =
        rawGeminiKeys
          .split(",")
          .map(
            k => k.trim()
          )
          .filter(Boolean);

      keyLoop:
      for (
        const apiKey of geminiKeys
      ) {
        try {
          const response =
            await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          text:
                            testPrompt
                        }
                      ]
                    }
                  ],

                  generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 8192,
                    responseMimeType:
                      "application/json",
                    responseSchema:
                      jsonSchema
                  }
                })
              }
            );

          const data =
            await response.json();

          if (
            response.ok &&
            data?.candidates?.[0]
              ?.content?.parts?.[0]
              ?.text
          ) {
            const rawText =
              data
                .candidates[0]
                .content
                .parts[0]
                .text;

            const qList =
              extractQuestionsFromRaw(
                rawText
              );

            for (
              const q of qList
            ) {
              const normalized =
                normalizeQuestion(q);

              if (!normalized) {
                continue;
              }

              finalQuestions.push(
                normalized
              );
            }

            if (
              finalQuestions.length >=
              questionCount
            ) {
              usedProvider =
                "Gemini 3.6 Flash";

              break keyLoop;
            }

            if (
              finalQuestions.length >= 10
            ) {
              usedProvider =
                "Gemini 3.6 Flash";

              break keyLoop;
            }

            finalQuestions = [];
          } else {
            errorLog.push(
              `Gemini: ${
                data?.error?.message ||
                response.statusText
              }`
            );
          }
        } catch (err) {
          errorLog.push(
            `Gemini: ${err.message}`
          );
        }
      }
    }

    // ==========================================
    // PHASE 2: FALLBACK PROVIDER
    // Anthropic Claude
    // ==========================================

    const anthropicKey =
      process.env.ANTHROPIC_API_KEY;

    if (
      finalQuestions.length === 0 &&
      anthropicKey
    ) {
      try {
        const claudeRes =
          await fetch(
            "https://api.anthropic.com/v1/messages",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "x-api-key":
                  anthropicKey,

                "anthropic-version":
                  "2023-06-01"
              },

              body: JSON.stringify({
                model:
                  "claude-3-5-sonnet-20241022",

                max_tokens:
                  4096,

                system:
                  `You are a CBSE test generator.

Return strictly a raw JSON object with a 'questions' array containing exactly ${questionCount} questions.

Every question MUST contain:
- question
- exactly 4 options
- correctAnswer
- explanation
- topic
- concept

The topic and concept must accurately describe the concept tested.

If topic or concept cannot be determined confidently, use an empty string.

No markdown.`,

                messages: [
                  {
                    role: "user",
                    content:
                      testPrompt
                  }
                ]
              })
            }
          );

        const claudeData =
          await claudeRes.json();

        if (
          claudeRes.ok &&
          claudeData?.content?.[0]
            ?.text
        ) {
          const rawText =
            claudeData
              .content[0]
              .text;

          const qList =
            extractQuestionsFromRaw(
              rawText
            );

          for (
            const q of qList
          ) {
            const normalized =
              normalizeQuestion(q);

            if (!normalized) {
              continue;
            }

            finalQuestions.push(
              normalized
            );
          }

          if (
            finalQuestions.length >=
            questionCount
          ) {
            usedProvider =
              "Anthropic Claude";
          } else if (
            finalQuestions.length >= 10
          ) {
            usedProvider =
              "Anthropic Claude";
          }
        } else {
          errorLog.push(
            `Claude: ${
              claudeData?.error?.message ||
              claudeRes.statusText
            }`
          );
        }
      } catch (claudeErr) {
        errorLog.push(
          `Claude: ${claudeErr.message}`
        );
      }
    }

    // ==========================================
    // PHASE 3: OUTPUT DELIVERY
    // ==========================================

    if (
      finalQuestions.length === 0
    ) {
      return res.status(500).json({
        success: false,

        error:
          `Assessment System: Unable to generate test. Details: ${errorLog
            .slice(0, 2)
            .join(" | ")}`
      });
    }

    const outQuestions =
      finalQuestions.slice(
        0,
        questionCount
      );

    return res.status(200).json({
      success: true,

      provider:
        usedProvider,

      class:
        className,

      subject:
        subject,

      chapter:
        chapter,

      requestedCount:
        questionCount,

      returnedCount:
        outQuestions.length,

      questions:
        outQuestions
    });

  } catch (error) {
    console.error(
      "Test Generator Error:",
      error
    );

    return res.status(500).json({
      success: false,

      error:
        `Server error: ${error.message}`
    });
  }
}