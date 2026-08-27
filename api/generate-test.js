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
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const apiKeyList = rawGeminiKeys
    ? rawGeminiKeys.split(",").map(k => k.trim()).filter(Boolean)
    : [];

  try {
    const body = req.body || {};
    const className = body.class || body.className || "Class 10";
    const subject = body.subject || "Physics";
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

    const responseSchema = {
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

    // STRICT TOPIC-FENCED PROMPT (Fixes Physics/Chemistry Leakage)
    const prompt = `
You are an expert Indian CBSE school examiner creating a STRICT, BOARD-LEVEL test paper.

TARGET PARAMETERS:
- CLASS: ${className}
- STRICT SUBJECT: ${subject}
- SPECIFIC CHAPTER / TOPIC: ${chapter}
- NUMBER OF QUESTIONS: ${questionCount}
- DIFFICULTY: ${difficulty}
- LANGUAGE: ${language}
- QUESTION TYPE: ${questionType}

CRITICAL RULES TO PREVENT SUBJECT CONTAMINATION:
1. ONLY generate questions strictly from the domain of "${subject}" and the chapter "${chapter}".
2. IF SUBJECT IS "Physics", YOU MUST NOT include ANY Chemistry (acids, bases, reactions, periodic table) or Biology (plants, human body, reproduction, cells).
3. IF SUBJECT IS "Chemistry", YOU MUST NOT include Physics kinematics, ray optics, electricity, or Biology.
4. IF SUBJECT IS "Mathematics", ONLY provide pure mathematical equations, geometry, trigonometry, arithmetic, or calculus.
5. Every question must have EXACTLY 4 options.
6. Randomize the correct answer index across 0, 1, 2, and 3. DO NOT place all correct answers at index 0 or 1.
7. Use standard LaTeX math ($ or $$) for numerical formulas, fractions, and superscripts.
8. Return strictly valid JSON matching the schema.
`;

    const MODELS = [
      "gemini-2.5-flash",
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
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

            const googleResponse = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  responseSchema: responseSchema,
                  temperature: 0.2 // CRITICAL FIX: Lowered temperature to stop AI from hallucinating cross-subject topics
                }
              })
            });

            if (!googleResponse.ok) continue;

            const geminiData = await googleResponse.json();
            const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) continue;

            const parsed = JSON.parse(rawText);
            const questionsArray = Array.isArray(parsed?.questions) ? parsed.questions : [];

            for (const q of questionsArray) {
              if (!q || typeof q !== "object") continue;

              const question = typeof q.question === "string" ? q.question.trim() : "";
              const explanation = typeof q.explanation === "string" ? q.explanation.trim() : "Review NCERT formula.";
              let options = Array.isArray(q.options)
                ? q.options.map(opt => typeof opt === "string" ? opt.trim() : "").filter(Boolean)
                : [];

              let correctAnswer = Number(q.correctAnswer);

              if (options.length === 4 && Number.isInteger(correctAnswer) && correctAnswer >= 0 && correctAnswer <= 3 && question) {
                // Ensure options are shuffled server-side to guarantee non-deterministic placement
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

            if (validQuestions.length > 0) {
              usedModel = model;
              break keyLoop;
            }
          } catch (modelErr) {
            console.error(`Gemini generation error on model ${model}:`, modelErr);
          }
        }
      }
    }

    // SUBJECT-AWARE EMERGENCY FALLBACK (Prevents Chemistry showing up in Physics)
    if (validQuestions.length === 0) {
      const subjectLower = subject.toLowerCase();
      
      let fallbackPool = [];
      if (subjectLower.includes("physic") || chapter.toLowerCase().includes("light") || chapter.toLowerCase().includes("motion")) {
        fallbackPool = [
          {
            question: "When light travels from an optically denser to a rarer medium, it bends: / जब प्रकाश सघन से विरल माध्यम में प्रवेश करता है, तो यह झुकता है:",
            options: ["Away from the normal", "Towards the normal", "Without deviation", "Reflects back along incident path"],
            correctAnswer: 0,
            explanation: "Speed of light increases in rarer mediums, causing the ray to bend away from the normal."
          },
          {
            question: "The focal length of a convex mirror having radius of curvature 40 cm is: / 40 सेमी वक्रता त्रिज्या वाले उत्तल दर्पण की फोकस दूरी है:",
            options: ["-20 cm", "+20 cm", "+40 cm", "-40 cm"],
            correctAnswer: 1,
            explanation: "f = +R/2 = +40/2 = +20 cm (convex mirror focal length is always positive)."
          },
          {
            question: "What is the SI unit of electric potential difference? / विद्युत विभवान्तर का SI मात्रक क्या है?",
            options: ["Ampere (A)", "Ohm (Ω)", "Volt (V)", "Coulomb (C)"],
            correctAnswer: 2,
            explanation: "Electric potential difference V = Work / Charge (Joules / Coulomb = Volt)."
          },
          {
            question: "The resistance of a wire is directly proportional to its: / किसी तार का प्रतिरोध किसके सीधे समानुपाती होता है?",
            options: ["Area of cross-section", "Diameter", "Temperature coefficient only", "Length (l)"],
            correctAnswer: 3,
            explanation: "R = ρ(L / A), so resistance is directly proportional to length."
          }
        ];
      } else if (subjectLower.includes("chem")) {
        fallbackPool = [
          {
            question: "Which of the following acids is present in lemons? / नींबू में कौन सा अम्ल उपस्थित होता है?",
            options: ["Citric acid", "Acetic acid", "Tartaric acid", "Oxalic acid"],
            correctAnswer: 0,
            explanation: "Citrus fruits like lemons and oranges contain citric acid."
          },
          {
            question: "What type of reaction occurs when iron rusts? / लोहे पर जंग लगना किस प्रकार की अभिक्रिया है?",
            options: ["Reduction only", "Redox (Oxidation-Reduction)", "Displacement only", "Endothermic synthesis"],
            correctAnswer: 1,
            explanation: "Rusting of iron requires both oxygen and moisture, which is a redox reaction."
          }
        ];
      } else {
        fallbackPool = [
          {
            question: "If sin θ = 1/2, what is the value of cos θ for an acute angle? / यदि sin θ = 1/2 है, तो cos θ का मान क्या होगा?",
            options: ["1/2", "√3/2", "1/√2", "√3"],
            correctAnswer: 1,
            explanation: "cos θ = √(1 - sin²θ) = √(1 - 1/4) = √3/2."
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
