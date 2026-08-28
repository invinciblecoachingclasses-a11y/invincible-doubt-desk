export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Only POST allowed." });

  const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
  if (!rawKeys) {
    return res.status(500).json({ success: false, error: "No GEMINI_API_KEY found in Vercel environment." });
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

    const questionCount = Math.min(Math.max(requestedCount, 1), 25);

    // Ultra-compressed prompt to ensure Gemini responds in < 3 seconds
    const prompt = `Generate ${questionCount} CBSE MCQs for Class ${className} ${subject}, Chapter: ${chapter}, Level: ${difficulty}, Lang: ${language}.
Format STRICTLY as valid JSON:
{"questions":[{"question":"Text?","options":["A","B","C","D"],"correctAnswer":0,"explanation":"Brief note."}]}`;

    const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let finalQuestions = [];
    let lastError = "";
    let usedModel = "";

    keyLoop: for (const key of apiKeyList) {
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
                maxOutputTokens: 3000
              }
            })
          });

          if (!response.ok) {
            const errData = await response.text();
            lastError = `HTTP ${response.status} on ${model}: ${errData.substring(0, 80)}`;
            continue;
          }

          const data = await response.json();
          let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!rawText) continue;

          // Strip Markdown code blocks if present
          rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

          const firstBrace = rawText.indexOf('{');
          const lastBrace = rawText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            rawText = rawText.substring(firstBrace, lastBrace + 1);
          }

          const parsed = JSON.parse(rawText);
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
            usedModel = model;
            break keyLoop;
          } else {
            finalQuestions = [];
          }
        } catch (err) {
          lastError = `${model} parse error: ${err.message}`;
        }
      }
    }

    if (finalQuestions.length === 0) {
      return res.status(500).json({
        success: false,
        error: `AI Generation Failed: ${lastError || "Timeout or invalid response format."}`
      });
    }

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
    return res.status(500).json({ success: false, error: `Server error: ${error.message}` });
  }
}
