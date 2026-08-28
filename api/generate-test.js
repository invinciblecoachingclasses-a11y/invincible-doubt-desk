export default async function handler(req, res) {
  // CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Only POST requests are allowed."
    });
  }

  // ENVIRONMENT KEYS
  const rawGeminiKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
  const apiKeyList = rawGeminiKeys
    ? rawGeminiKeys.split(",").map(k => k.trim()).filter(Boolean)
    : [];

  try {
    const body = req.body || {};
    const className = body.class || body.className || "Class 10";
    const subject = body.subject || "Science";
    const chapter = body.chapter || "Full Syllabus Overview";
    const requestedCount = Number(body.count || body.numberOfQuestions || 20);
    const difficulty = body.difficulty || "Moderate";
    const language = body.language || "English and Pure Devanagari Hindi";
    const questionType = body.questionType || body.type || "MCQ";
    const organization = body.organization || body.school_id || "Indian Academic Institution";

    const questionCount = Math.min(
      Math.max(Number.isFinite(requestedCount) ? requestedCount : 20, 1),
      50
    );

    // STRICT PROMPT-BASED JSON ENFORCEMENT (Faster and less prone to API timeouts)
    const prompt = `
You are an expert CBSE examiner creating a STRICT, BOARD-LEVEL test paper.

TARGET PARAMETERS:
- CLASS: ${className}
- SUBJECT: ${subject}
- CHAPTER / TOPIC: ${chapter}
- NUMBER OF QUESTIONS: ${questionCount}
- DIFFICULTY: ${difficulty}
- LANGUAGE: ${language}

CRITICAL RULES:
1. ONLY generate questions from "${subject}" and the chapter "${chapter}". Do not mix subjects.
2. Every question must have EXACTLY 4 options.
3. Provide a brief 1-line explanation for the correct answer.
4. Output MUST be purely a JSON object. Do NOT wrap it in markdown blockquotes like \`\`\`json. 

Output EXACTLY in this JSON format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 1,
      "explanation": "Brief explanation here."
    }
  ]
}
`;

    const MODELS = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b"
    ];

    let validQuestions = [];
    let usedModel = "database-fallback";

    if (apiKeyList.length > 0) {
      keyLoop: for (const key of apiKeyList) {
        for (const model of MODELS) {
          try {
            const apiUrl = `[https://generativelanguage.googleapis.com/v1beta/models/$](https://generativelanguage.googleapis.com/v1beta/models/$){model}:generateContent?key=${encodeURIComponent(key)}`;

            const googleResponse = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.3
                }
              })
            });

            if (!googleResponse.ok) continue;

            const geminiData = await googleResponse.json();
            let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) continue;

            // Strip Markdown formatting to prevent JSON.parse crashes
            rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(rawText);
            
            const questionsArray = Array.isArray(parsed?.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : []);

            for (const q of questionsArray) {
              if (!q || typeof q !== "object") continue;

              const question = typeof q.question === "string" ? q.question.trim() : "";
              const explanation = typeof q.explanation === "string" ? q.explanation.trim() : "Review NCERT rules.";
              let options = Array.isArray(q.options)
                ? q.options.map(opt => typeof opt === "string" ? opt.trim() : "").filter(Boolean)
                : [];

              let correctAnswer = Number(q.correctAnswer);

              if (options.length === 4 && Number.isInteger(correctAnswer) && correctAnswer >= 0 && correctAnswer <= 3 && question) {
                
                // Shuffle options server-side to guarantee randomness
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

            if (validQuestions.length >= 5) { // Accept if we got at least 5 valid questions
              usedModel = model;
              break keyLoop;
            }
          } catch (modelErr) {
            console.error(`Gemini parsing error on model ${model}:`, modelErr);
          }
        }
      }
    }

    // SUBJECT-AWARE EMERGENCY FALLBACK (Only triggers if API fails completely)
    if (validQuestions.length === 0) {
      const subjectLower = subject.toLowerCase();
      
      let fallbackPool = [];
      if (subjectLower.includes("physic") || chapter.toLowerCase().includes("light")) {
        fallbackPool = [
          {
            question: "When light travels from an optically denser to a rarer medium, it bends:",
            options: ["Away from the normal", "Towards the normal", "Without deviation", "Reflects back"],
            correctAnswer: 0,
            explanation: "Speed of light increases in rarer mediums."
          },
          {
            question: "The SI unit of electric potential difference is:",
            options: ["Ampere (A)", "Ohm (Ω)", "Volt (V)", "Coulomb (C)"],
            correctAnswer: 2,
            explanation: "V = W/Q (Joules/Coulomb = Volt)."
          }
        ];
      } else if (subjectLower.includes("chem")) {
        fallbackPool = [
          {
            question: "Which acid is present in lemons?",
            options: ["Citric acid", "Acetic acid", "Tartaric acid", "Oxalic acid"],
            correctAnswer: 0,
            explanation: "Citrus fruits contain citric acid."
          }
        ];
      } else {
        fallbackPool = [
          {
            question: "If sin θ = 1/2, what is cos θ for an acute angle?",
            options: ["1/2", "√3/2", "1/√2", "√3"],
            correctAnswer: 1,
            explanation: "cos θ = √(1 - sin²θ) = √3/2."
          }
        ];
      }
      validQuestions = fallbackPool;
    }

    const finalQuestions = validQuestions.slice(0, questionCount);

    return res.status(200).json({
      success: true,
      model: usedModel,
      organization_id: organization,
      class: className,
      subject: subject,
      chapter: chapter,
      difficulty: difficulty,
      language: language,
      questionType: questionType,
      requestedCount: questionCount,
      returnedCount: finalQuestions.length,
      questions: finalQuestions
    });

  } catch (error) {
    console.error("AI TEST GENERATOR FATAL ERROR:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Unexpected server error."
    });
  }
}
