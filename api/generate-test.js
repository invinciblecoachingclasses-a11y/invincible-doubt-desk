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

    const questionCount = Math.min(Math.max(requestedCount, 1), 30);

    const prompt = `Create exactly ${questionCount} multiple-choice questions for CBSE Board exam prep.
Class: ${className}
Subject: ${subject}
Topic: ${chapter}
Difficulty: ${difficulty}
Language: ${language}

Rules:
1. Generate questions strictly from ${subject} - ${chapter}.
2. Provide exactly 4 options per question.
3. Return ONLY a valid JSON object matching the format below without any markdown wrapper:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief concept rule."
    }
  ]
}`;

    let finalQuestions = [];
    let lastError = "No supported models found.";
    let activeModelName = "";

    keyLoop: for (const key of apiKeyList) {
      // Step 1: Query Google dynamically for all models supported by this specific key
      let candidateModels = [];
      try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (listRes.ok) {
          const listData = await listRes.json();
          const available = (listData.models || [])
            .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace("models/", ""));

          const priorityList = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-002",
            "gemini-1.5-flash-latest",
            "gemini-pro"
          ];

          candidateModels = priorityList.filter(p => available.includes(p));
          if (candidateModels.length === 0 && available.length > 0) {
            candidateModels = available;
          }
        }
      } catch (e) {
        // Fallback to standard aliases if ListModels request fails
      }

      if (candidateModels.length === 0) {
        candidateModels = ["gemini-2.0-flash", "gemini-1.5-flash-001", "gemini-1.5-flash-002", "gemini-1.5-flash", "gemini-pro"];
      }

      // Step 2: Request question generation using the confirmed models
      for (const model of candidateModels) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2 }
            })
          });

          if (!response.ok) {
            const errData = await response.text();
            lastError = `HTTP ${response.status} on ${model}: ${errData.substring(0, 100)}`;
            continue;
          }

          const data = await response.json();
          let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!rawText) {
            lastError = `${model} returned empty content.`;
            continue;
          }

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
              explanation: String(q.explanation || "Review NCERT chapter summary.")
            });
          }

          if (finalQuestions.length >= 5) {
            activeModelName = model;
            break keyLoop;
          } else {
            finalQuestions = [];
            lastError = `${model} produced fewer than 5 parseable questions.`;
          }
        } catch (err) {
          lastError = `Parse error on ${model}: ${err.message}`;
        }
      }
    }

    if (finalQuestions.length === 0) {
      return res.status(500).json({
        success: false,
        error: `AI Generation Failed: ${lastError}`
      });
    }

    const outQuestions = finalQuestions.slice(0, questionCount);

    return res.status(200).json({
      success: true,
      model: activeModelName,
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
