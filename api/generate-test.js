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
3. Return ONLY a valid JSON object starting with { and ending with }. No markdown, no backticks.
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

    const MODELS = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b"];
    let validQuestions = [];
    let usedModel = "database-fallback";
    
    // Default error message if keys are missing completely
    let lastErrorMsg = apiKeyList.length === 0 ? "No API Keys found in Vercel Environment Variables" : "Unknown Error";

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
              lastErrorMsg = `API HTTP ${googleResponse.status}: ${googleResponse.statusText}`;
              continue; // Jump to next model if API rejects
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
              const explanation = typeof q.explanation === "string" ? q.explanation.trim() : "Review chapter concepts.";
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

            // Accept if we get at least half the requested amount
            if (validQuestions.length >= (questionCount / 2)) {
              usedModel = model;
              lastErrorMsg = "Success";
              break keyLoop;
            } else {
              lastErrorMsg = `Only extracted ${validQuestions.length} valid questions.`;
              validQuestions = []; 
            }
          } catch (modelErr) {
            lastErrorMsg = `Code Parse Error: ${modelErr.message}`;
          }
        }
      }
    }

    // ON-SCREEN DIAGNOSTIC FALLBACK
    // If it fails, the UI will print EXACTLY why it failed in the question text and explanation!
    if (validQuestions.length === 0) {
      validQuestions = Array.from({length: questionCount}).map((_, i) => ({
          question: `[Diagnostic Q${i+1}] AI connection failed for ${chapter} (${subject}). See explanation below.`,
          options: ["Fix API Key", "Fix Vercel Settings", "Check Logs", `Error: ${lastErrorMsg.substring(0, 15)}...`],
          correctAnswer: 0,
          explanation: `System Diagnostic - Keys Available: ${apiKeyList.length}. Fatal Error Reason: ${lastErrorMsg}`
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
