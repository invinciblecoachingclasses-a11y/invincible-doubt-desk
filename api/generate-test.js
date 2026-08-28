export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Only POST allowed." });

  // Get keys directly from environment
  const rawGeminiKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
  const apiKeyList = rawGeminiKeys ? rawGeminiKeys.split(",").map(k => k.trim()).filter(Boolean) : [];

  try {
    const body = req.body || {};
    const className = body.class || body.className || "Class 10";
    const subject = body.subject || "Science";
    const chapter = body.chapter || "Full Syllabus";
    const requestedCount = Number(body.count || body.numberOfQuestions || 20);
    const difficulty = body.difficulty || "Moderate";
    const language = body.language || "English and Hindi";

    const questionCount = Math.min(Math.max(Number.isFinite(requestedCount) ? requestedCount : 20, 1), 30);

    const prompt = `Generate EXACTLY ${questionCount} multiple-choice questions.
Target: Class ${className}, Subject: ${subject}, Topic: ${chapter}, Difficulty: ${difficulty}, Language: ${language}.
Rules:
1. Stay strictly within the topic.
2. Exactly 4 options per question.
3. Return ONLY a valid JSON object starting with { and ending with }. No markdown.
Format:
{
  "questions": [
    {
      "question": "text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 1,
      "explanation": "reason"
    }
  ]
}`;

    // FIX: Using ONLY the globally stable model to prevent the 404 Not Found error
    const MODELS = ["gemini-1.5-flash"];
    
    let validQuestions = [];
    let usedModel = "database-fallback";
    let lastErrorMsg = apiKeyList.length === 0 ? "No API Keys found in Vercel" : "Unknown Error";

    if (apiKeyList.length > 0) {
      keyLoop: for (const key of apiKeyList) {
        for (const model of MODELS) {
          try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

            const googleResponse = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2 } 
              })
            });

            if (!googleResponse.ok) {
              const errText = await googleResponse.text();
              lastErrorMsg = `HTTP ${googleResponse.status}: ${errText.substring(0, 40)}`;
              continue; // If 404 or 400, skip
            }

            const geminiData = await googleResponse.json();
            let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!rawText) {
              lastErrorMsg = "API returned empty text.";
              continue;
            }

            // Aggressive JSON Extraction
            const firstBrace = rawText.indexOf('{');
            const lastBrace = rawText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                rawText = rawText.substring(firstBrace, lastBrace + 1);
            }

            const parsed = JSON.parse(rawText);
            const questionsArray = Array.isArray(parsed?.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : []);

            for (const q of questionsArray) {
              if (!q || typeof q !== "object") continue;
              const question = typeof q.question === "string" ? q.question.trim() : "";
              const explanation = typeof q.explanation === "string" ? q.explanation.trim() : "Review concepts.";
              let options = Array.isArray(q.options) ? q.options.map(opt => typeof opt === "string" ? opt.trim() : "").filter(Boolean) : [];
              let correctAnswer = Number(q.correctAnswer);

              if (options.length === 4 && Number.isInteger(correctAnswer) && correctAnswer >= 0 && correctAnswer <= 3 && question) {
                const indexed = options.map((opt, i) => ({ opt, isCorrect: i === correctAnswer }));
                for (let i = indexed.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
                }
                validQuestions.push({
                  question,
                  options: indexed.map(item => item.opt),
                  correctAnswer: indexed.findIndex(item => item.isCorrect),
                  explanation
                });
              }
            }

            if (validQuestions.length >= (questionCount / 2)) {
              usedModel = model;
              lastErrorMsg = "Success";
              break keyLoop;
            } else {
              lastErrorMsg = `Extracted only ${validQuestions.length} valid Qs.`;
              validQuestions = []; 
            }
          } catch (modelErr) {
            lastErrorMsg = `Parse Error: ${modelErr.message.substring(0, 30)}`;
          }
        }
      }
    }

    if (validQuestions.length === 0) {
      validQuestions = Array.from({length: questionCount}).map((_, i) => ({
          question: `[Diagnostic Q${i+1}] AI failed for ${chapter} (${subject}).`,
          options: ["Check Logs", "Try Again", "Error Below", `Err: ${lastErrorMsg}`],
          correctAnswer: 0,
          explanation: `System Diagnostic - Keys: ${apiKeyList.length}. Reason: ${lastErrorMsg}`
      }));
    }

    const finalQuestions = validQuestions.slice(0, questionCount);

    return res.status(200).json({
      success: true,
      model: usedModel,
      class: className,
      subject: subject,
      chapter: chapter,
      requestedCount: questionCount,
      returnedCount: finalQuestions.length,
      questions: finalQuestions
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error?.message || "Unexpected server error." });
  }
}
