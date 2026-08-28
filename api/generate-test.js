export const maxDuration = 45;

export default async function handler(req, res) {
  // CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Only POST allowed" });

  try {
    const body = req.body || {};
    const className = body.className || body.class || "12";
    const subject = body.subject || "Physics";
    const chapter = body.chapter || "Full Syllabus";
    const requestedCount = Number(body.count || body.numberOfQuestions || 20);
    const difficulty = body.difficulty || "Moderate";
    const language = body.language || "English and Hindi";

    const questionCount = Math.min(Math.max(requestedCount, 1), 25);

    const testPrompt = `Create exactly ${questionCount} multiple-choice questions (MCQs) for CBSE Board Exam.
Class: ${className}
Subject: ${subject}
Topic: ${chapter}
Difficulty: ${difficulty}
Language: ${language}

Rules:
1. Stay strictly on the topic: ${subject} - ${chapter}.
2. Provide exactly 4 options per question.
3. For math/physics symbols, use standard Unicode (e.g. θ, λ, μ, Ω, ε, π, √, x²).
4. Do NOT use unescaped double quotes inside strings.`;

    // Strict JSON Schema Definition (Enforced by Gemini token decoder)
    const jsonSchema = {
      type: "OBJECT",
      properties: {
        questions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              options: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              correctAnswer: { type: "INTEGER" },
              explanation: { type: "STRING" }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      },
      required: ["questions"]
    };

    let finalQuestions = [];
    let errorLog = [];
    let usedProvider = "";

    // ==========================================
    // PHASE 1: Primary Provider (Google Gemini)
    // ==========================================
    const rawGeminiKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
    if (rawGeminiKeys) {
      const geminiKeys = rawGeminiKeys.split(",").map(k => k.trim()).filter(Boolean);
      const geminiModels = ["gemini-3.6-flash", "gemini-1.5-flash"];

      keyLoop: for (const apiKey of geminiKeys) {
        for (const model of geminiModels) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: testPrompt }] }],
                  generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                    responseSchema: jsonSchema
                  }
                })
              }
            );

            const data = await response.json();
            if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
              const rawText = data.candidates[0].content.parts[0].text;
              const parsed = JSON.parse(rawText);
              const qList = Array.isArray(parsed?.questions) ? parsed.questions : [];

              for (const q of qList) {
                if (!q || !q.question || !Array.isArray(q.options) || q.options.length < 2) continue;

                let cIndex = Number(q.correctAnswer) || 0;
                if (cIndex < 0 || cIndex >= q.options.length) cIndex = 0;

                const indexed = q.options.map((opt, i) => ({ opt: String(opt), isCorrect: i === cIndex }));
                for (let i = indexed.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
                }

                finalQuestions.push({
                  question: String(q.question),
                  options: indexed.map(x => x.opt),
                  correctAnswer: indexed.findIndex(x => x.isCorrect),
                  explanation: String(q.explanation || "Review NCERT concepts.")
                });
              }

              if (finalQuestions.length >= 5) {
                usedProvider = `Gemini (${model})`;
                break keyLoop;
              } else {
                finalQuestions = [];
              }
            } else {
              errorLog.push(`Gemini [${model}]: ${data?.error?.message || response.statusText}`);
            }
          } catch (err) {
            errorLog.push(`Gemini [${model}]: ${err.message}`);
          }
        }
      }
    }

    // ==========================================
    // PHASE 2: Fallback Provider (Anthropic Claude)
    // ==========================================
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (finalQuestions.length === 0 && anthropicKey) {
      try {
        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4096,
            system: "You are a CBSE test generator. Return strictly a raw JSON object with a 'questions' array. No markdown, no introductory text.",
            messages: [{ role: "user", content: testPrompt }]
          })
        });

        const claudeData = await claudeRes.json();
        if (claudeRes.ok && claudeData?.content?.[0]?.text) {
          let rawText = claudeData.content[0].text.trim();
          rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

          const firstBrace = rawText.indexOf('{');
          const lastBrace = rawText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            rawText = rawText.substring(firstBrace, lastBrace + 1);
          }

          const parsed = JSON.parse(rawText);
          const qList = Array.isArray(parsed?.questions) ? parsed.questions : [];

          for (const q of qList) {
            if (!q || !q.question || !Array.isArray(q.options) || q.options.length < 2) continue;

            let cIndex = Number(q.correctAnswer) || 0;
            if (cIndex < 0 || cIndex >= q.options.length) cIndex = 0;

            const indexed = q.options.map((opt, i) => ({ opt: String(opt), isCorrect: i === cIndex }));
            for (let i = indexed.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
            }

            finalQuestions.push({
              question: String(q.question),
              options: indexed.map(x => x.opt),
              correctAnswer: indexed.findIndex(x => x.isCorrect),
              explanation: String(q.explanation || "Review NCERT concepts.")
            });
          }

          if (finalQuestions.length >= 5) {
            usedProvider = "Anthropic Claude";
          }
        } else {
          errorLog.push(`Claude: ${claudeData?.error?.message || claudeRes.statusText}`);
        }
      } catch (claudeErr) {
        errorLog.push(`Claude: ${claudeErr.message}`);
      }
    }

    // ==========================================
    // PHASE 3: Output Delivery
    // ==========================================
    if (finalQuestions.length === 0) {
      return res.status(500).json({
        success: false,
        error: `Assessment System: Unable to generate test. Details: ${errorLog.slice(0, 2).join(" | ")}`
      });
    }

    const outQuestions = finalQuestions.slice(0, questionCount);

    return res.status(200).json({
      success: true,
      provider: usedProvider,
      class: className,
      subject: subject,
      chapter: chapter,
      requestedCount: questionCount,
      returnedCount: outQuestions.length,
      questions: outQuestions
    });

  } catch (error) {
    console.error("Test Generator Error:", error);
    return res.status(500).json({ success: false, error: `Server error: ${error.message}` });
  }
}
