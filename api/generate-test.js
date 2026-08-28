export default async function handler(req, res) {
  // CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Only POST allowed." });

  // Get keys directly from Vercel environment
  const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
  if (!rawKeys) {
    return res.status(500).json({ success: false, error: "CRITICAL: No GEMINI_API_KEY found in Vercel environment variables." });
  }

  const apiKeyList = rawKeys.split(",").map(k => k.trim()).filter(Boolean);

  try {
    const body = req.body || {};
    const className = body.className || body.class || "10";
    const subject = body.subject || "Science";
    const chapter = body.chapter || "Full Syllabus";
    const requestedCount = Number(body.count || body.numberOfQuestions || 20);
    const difficulty = body.difficulty || "Moderate";
    const language = body.language || "English and Hindi";

    const questionCount = Math.min(Math.max(requestedCount, 1), 30);

    const prompt = `Create exactly ${questionCount} multiple-choice questions.
Class: ${className}
Subject: ${subject}
Topic: ${chapter}
Difficulty: ${difficulty}
Language: ${language}

Rules:
1. Stay strictly within the topic.
2. Exactly 4 options per question.
3. Return ONLY a valid JSON object.
4. Use this exact schema:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,
      "explanation": "Brief reason."
    }
  ]
}`;

    // Strictly using 1.5 models which support native JSON responses
    const MODELS = ["gemini-1.5-flash", "gemini-1.5-pro"];
    
    let finalQuestions = [];
    let lastError = "Unknown error";
    let usedModel = "";

    for (const key of apiKeyList) {
      for (const model of MODELS) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
          
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { 
                temperature: 0.2,
                responseMimeType: "application/json" // Forces Gemini to return clean, crash-free JSON
              }
            })
          });

          if (!response.ok) {
            const errData = await response.text();
            lastError = `Google API HTTP ${response.status}: ${errData}`;
            continue; // Skip to next model if this one fails
          }

          const data = await response.json();
          let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (!rawText) {
            lastError = "Google API returned success but empty text.";
            continue;
          }

          // Because of responseMimeType, parsing will be clean
          const parsed = JSON.parse(rawText);
          const qList = Array.isArray(parsed?.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : []);

          for (const q of qList) {
            if (!q || !q.question || !Array.isArray(q.options) || q.options.length < 2) continue;
            
            let cIndex = Number(q.correctAnswer) || 0;
            if (cIndex < 0 || cIndex >= q.options.length) cIndex = 0;

            // Shuffle options 
            const indexed = q.options.map((opt, i) => ({ opt: String(opt), isCorrect: i === cIndex }));
            for (let i = indexed.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
            }

            finalQuestions.push({
              question: String(q.question),
              options: indexed.map(x => x.opt),
              correctAnswer: indexed.findIndex(x => x.isCorrect),
              explanation: String(q.explanation || "Review chapter concepts.")
            });
          }

          if (finalQuestions.length >= (questionCount / 2)) {
            usedModel = model;
            break; // Success! Break out of model loop
          } else {
            finalQuestions = [];
            lastError = `Parsed correctly, but Gemini only output ${qList.length} valid questions.`;
          }

        } catch (err) {
          lastError = `Server Parse Error: ${err.message}`;
        }
      }
      if (finalQuestions.length > 0) break; // Break out of key loop
    }

    // IF GEMINI FAILS, THROW ACTUAL ERROR TO FRONTEND UI
    if (finalQuestions.length === 0) {
      return res.status(500).json({ 
        success: false, 
        error: `Real AI Generation Failed. Reason: ${lastError}` 
      });
    }

    // Force exactly the requested number of questions
    const outQuestions = finalQuestions.slice(0, questionCount);

    return res.status(200).json({
      success: true,
      model: usedModel,
      class: className,
      subject: subject,
      chapter: chapter,
      requestedCount: questionCount,
      returnedCount: outQuestions.length,
      questions: outQuestions
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error?.message || "Unexpected server error." });
  }
}
