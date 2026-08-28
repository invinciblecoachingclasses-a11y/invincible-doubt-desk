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

    // CRITICAL: Explicit instruction to avoid LaTeX backslashes that corrupt JSON strings
    const testPrompt = `You are a CBSE Board Examiner creating an exam paper.
Generate exactly ${questionCount} multiple-choice questions (MCQs).

Class: ${className}
Subject: ${subject}
Topic: ${chapter}
Difficulty: ${difficulty}
Language: ${language}

STRICT FORMATTING RULES:
1. Stay strictly on the topic: ${subject} - ${chapter}.
2. Provide exactly 4 options per question.
3. FORMULAS & MATH: DO NOT use LaTeX backslashes (NO \\frac, NO \\sqrt, NO \\epsilon, NO \\theta). Write formulas in clean plain text with Unicode symbols: e.g., θ, λ, μ, Ω, ε0, π, √, x², F = q(E + v × B), V = IR.
4. Output MUST be ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,
      "explanation": "Brief explanation"
    }
  ]
}`;

    // Helper to sanitize broken JSON escape sequences
    function robustJsonParse(text) {
      let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      try {
        return JSON.parse(cleaned);
      } catch (e1) {
        // Fix invalid escape characters (e.g., \e, \O, \s, \m, invalid \u sequences)
        try {
          let sanitized = cleaned
            .replace(/\\u(?![0-9a-fA-F]{4})/g, "\\\\u")
            .replace(/\\([^"\\\/bfnrtu])/g, "\\\\$1");
          return JSON.parse(sanitized);
        } catch (e2) {
          // If JSON.parse still fails, extract question blocks via Regex
          const questions = [];
          const qRegex = /"question"\s*:\s*"([^"]+)"[\s\S]*?"options"\s*:\s*\[([\s\S]*?)\][\s\S]*?"correctAnswer"\s*:\s*(\d+)[\s\S]*?"explanation"\s*:\s*"([^"]*)"/g;
          let match;
          while ((match = qRegex.exec(cleaned)) !== null) {
            const rawOptions = match[2].match(/"([^"]+)"/g) || [];
            const parsedOptions = rawOptions.map(o => o.replace(/^"|"$/g, '').trim());
            if (parsedOptions.length >= 2) {
              questions.push({
                question: match[1],
                options: parsedOptions,
                correctAnswer: parseInt(match[3], 10),
                explanation: match[4] || "Review NCERT concepts."
              });
            }
          }
          if (questions.length >= 5) return { questions };
          throw new Error("Unable to parse structured JSON from model response.");
        }
      }
    }

    let finalQuestions = [];
    let errorLog = [];
    let usedProvider = "";

    // ==========================================
    // PHASE 1: Primary Provider (Google Gemini)
    // ==========================================
    const rawGeminiKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
    if (rawGeminiKeys) {
      const geminiKeys = rawGeminiKeys.split(",").map(k => k.trim()).filter(Boolean);
      const geminiModels = ["gemini-3.6-flash"];

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
                    responseMimeType: "application/json"
                  }
                })
              }
            );

            const data = await response.json();
            if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
              const rawText = data.candidates[0].content.parts[0].text;
              const parsed = robustJsonParse(rawText);
              const qList = Array.isArray(parsed?.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : []);

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
            system: "You are a CBSE test generator. Return ONLY valid JSON matching the requested schema.",
            messages: [{ role: "user", content: testPrompt }]
          })
        });

        const claudeData = await claudeRes.json();
        if (claudeRes.ok && claudeData?.content?.[0]?.text) {
          const rawText = claudeData.content[0].text;
          const parsed = robustJsonParse(rawText);
          const qList = Array.isArray(parsed?.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : []);

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
    // PHASE 3: Delivery
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
