export default async function handler(req, res) {
  // CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Only POST requests are allowed." });
  }

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

    // Strictly enforce 20 questions
    const questionCount = Math.min(Math.max(Number.isFinite(requestedCount) ? requestedCount : 20, 1), 30);

    // Super strict, minimal prompt to ensure speed and correct count
    const prompt = `You are a CBSE test generator. Generate EXACTLY ${questionCount} multiple-choice questions.
Target: Class ${className}, Subject: ${subject}, Topic: ${chapter}, Difficulty: ${difficulty}, Language: ${language}.
Rules:
1. Stay strictly within the topic of ${subject} - ${chapter}. Do not mix subjects.
2. Provide exactly 4 options per question.
3. Return ONLY a valid JSON object. No markdown, no backticks.
Format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Opt1", "Opt2", "Opt3", "Opt4"],
      "correctAnswer": 1,
      "explanation": "Short reason."
    }
  ]
}`;

    const MODELS = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b"];
    let validQuestions = [];
    let usedModel = "database-fallback";

    if (apiKeyList.length > 0) {
      keyLoop: for (const key of apiKeyList) {
        for (const model of MODELS) {
          try {
            // FIX: Restored the clean, correct API URL (No Markdown links)
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

            const googleResponse = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.2
                }
              })
            });

            if (!googleResponse.ok) continue;

            const geminiData = await googleResponse.json();
            let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) continue;

            // Clean the text to guarantee JSON parsing works
            rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(rawText);
            const questionsArray = Array.isArray(parsed?.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : []);

            for (const q of questionsArray) {
              if (!q || typeof q !== "object") continue;
              const question = typeof q.question === "string" ? q.question.trim() : "";
              const explanation = typeof q.explanation === "string" ? q.explanation.trim() : "Review chapter concepts.";
              let options = Array.isArray(q.options) ? q.options.map(opt => typeof opt === "string" ? opt.trim() : "").filter(Boolean) : [];
              let correctAnswer = Number(q.correctAnswer);

              if (options.length === 4 && Number.isInteger(correctAnswer) && correctAnswer >= 0 && correctAnswer <= 3 && question) {
                // Shuffle options to prevent pattern prediction
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

            // If it generated the required amount, break out of loops
            if (validQuestions.length >= (questionCount / 2)) {
              usedModel = model;
              break keyLoop;
            } else {
              validQuestions = []; 
            }
          } catch (modelErr) {
            console.error(`Gemini parsing error on model ${model}:`, modelErr);
          }
        }
      }
    }

    // FALLBACK: If Vercel times out or Gemini is down, generate 20 placeholder questions so the UI doesn't break
    if (validQuestions.length === 0) {
      validQuestions = Array.from({length: questionCount}).map((_, i) => ({
          question: `[Fallback Q${i+1}] Which of the following is an essential concept in ${chapter} (${subject})?`,
          options: ["Concept A", "Concept B", "Concept C", "Concept D"],
          correctAnswer: 0,
          explanation: `Fallback generation due to AI timeout. Please try again.`
      }));
    }

    // Force exactly 20 questions
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
    console.error("AI TEST GENERATOR FATAL ERROR:", error);
    return res.status(500).json({ success: false, error: error?.message || "Unexpected server error." });
  }
}
