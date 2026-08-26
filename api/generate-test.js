export default async function handler(req, res) {
  // ============================================================
  // CORS HEADERS
  // ============================================================
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

  // ============================================================
  // ENVIRONMENT KEYS
  // ============================================================
  const rawGeminiKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const apiKeyList = rawGeminiKeys
    ? rawGeminiKeys.split(",").map(k => k.trim()).filter(Boolean)
    : [];

  try {
    // ==========================================================
    // EXTRACT USER SETTINGS & MULTI-TENANT CONTEXT
    // ==========================================================
    const body = req.body || {};
    const className = body.class || body.className || "Class 10";
    const subject = body.subject || "Science";
    const chapter = body.chapter || "Full Syllabus Overview";
    const requestedCount = Number(body.count || body.numberOfQuestions || 20);
    const difficulty = body.difficulty || "Moderate";
    const language = body.language || "English and Pure Devanagari Hindi";
    const questionType = body.questionType || body.type || "MCQ";
    
    // NEW: Multi-Tenant Identifiers
    const organization = body.organization || body.school_id || "Indian Academic Institution";

    const questionCount = Math.min(
      Math.max(Number.isFinite(requestedCount) ? requestedCount : 20, 1),
      50
    );

    // ==========================================================
    // STRUCTURED JSON SCHEMA
    // ==========================================================
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

    // ==========================================================
    // PROMPT (Now School-Aware)
    // ==========================================================
    const prompt = `
You are an expert Indian CBSE school teacher creating a board-level question paper for ${organization}.

Generate a practice assessment using the following settings:
CLASS: ${className}
SUBJECT: ${subject}
CHAPTER / TOPIC: ${chapter}
NUMBER OF QUESTIONS: ${questionCount}
DIFFICULTY: ${difficulty}
LANGUAGE: ${language}
QUESTION TYPE: ${questionType}

STRICT INSTRUCTIONS:
1. Generate EXACTLY ${questionCount} high-yield questions suitable for ${className} CBSE syllabus.
2. Questions must test conceptual understanding, NCERT core rules, and examiner traps.
3. For MCQs:
   - Exactly 4 options per question.
   - Exactly one correct option.
   - correctAnswer must be 0, 1, 2, or 3 (0=first, 1=second, 2=third, 3=fourth).
4. Provide a 1-line educational explanation for every answer.
5. If bilingual language is selected, provide the stem and options in English followed by Hindi translation.
6. Use standard LaTeX math ($ or $$) for all formulas, equations, and superscripts.
7. Return strictly valid JSON adhering to the specified schema.
`;

    // Resilient model hierarchy for maximum speed and quota resilience
    const MODELS = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b"
    ];

    let validQuestions = [];
    let usedModel = "database-fallback";

    // ==========================================================
    // ATTEMPT GEMINI GENERATION
    // ==========================================================
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
                  temperature: 0.3
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

              let correctAnswer = q.correctAnswer;
              if (typeof correctAnswer === "string") {
                const upper = correctAnswer.trim().toUpperCase();
                if (["A", "B", "C", "D"].includes(upper)) {
                  correctAnswer = "ABCD".indexOf(upper);
                } else if (/^[0-3]$/.test(upper)) {
                  correctAnswer = Number(upper);
                }
              }

              if (options.length === 4 && Number.isInteger(correctAnswer) && correctAnswer >= 0 && correctAnswer <= 3 && question) {
                validQuestions.push({
                  question,
                  options,
                  correctAnswer,
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

    // ==========================================================
    // ZERO-FAILURE BACKUP POOL (Filtered by School if available)
    // ==========================================================
    if (validQuestions.length === 0 && supabaseUrl && supabaseKey) {
      try {
        const cleanClass = className.replace(/[^0-9]/g, "") || "10";
        // Attempt to fetch school-specific backup questions first
        let qUrl = `${supabaseUrl}/rest/v1/weekly_tests?class_name=eq.${cleanClass}&select=*&limit=50`;
        if (organization !== "Indian Academic Institution" && organization !== "ALL") {
             qUrl += `&school_id=eq.${encodeURIComponent(organization)}`;
        }
        
        const qRes = await fetch(qUrl, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        const dbList = await qRes.json();
        
        if (Array.isArray(dbList) && dbList.length > 0) {
          validQuestions = dbList
            .sort(() => 0.5 - Math.random())
            .map(item => {
              const opts = Array.isArray(item.options) ? item.options : [item.option_1, item.option_2, item.option_3, item.option_4].filter(Boolean);
              return {
                question: item.question || item.question_text || "CBSE Chapter Assessment",
                options: opts.length === 4 ? opts : ["Option A", "Option B", "Option C", "Option D"],
                correctAnswer: Number.isInteger(item.correct_option) ? item.correct_option : 0,
                explanation: item.explanation || "Review fundamental laws and concepts."
              };
            });
        }
      } catch (dbErr) {
        console.error("Supabase test fallback error:", dbErr);
      }
    }

    // Static Procedural Fallback Pool 
    if (validQuestions.length === 0) {
      const emergencyPool = [
        {
          question: "What is the SI unit of electric potential difference? / विद्युत विभवान्तर का SI मात्रक क्या है?",
          options: ["Volt (V)", "Ampere (A)", "Ohm (Ω)", "Coulomb (C)"],
          correctAnswer: 0,
          explanation: "Potential difference is work done per unit charge (V = W/Q), measured in Volts."
        },
        {
          question: "When light travels from an optically denser to a rarer medium, it bends: / जब प्रकाश सघन से विरल माध्यम में प्रवेश करता है, तो यह झुकता है:",
          options: ["Towards the normal", "Away from the normal", "Without deviation", "Reflects completely at all angles"],
          correctAnswer: 1,
          explanation: "Speed of light increases in a rarer medium, causing the refracted ray to bend away from the normal."
        },
        {
          question: "Which of the following compounds is the main constituent of baking powder? / बेकिंग पाउडर का मुख्य घटक कौन सा है?",
          options: ["Sodium carbonate (Na₂CO₃)", "Sodium hydrogen carbonate (NaHCO₃)", "Calcium oxychloride (CaOCl₂)", "Sodium hydroxide (NaOH)"],
          correctAnswer: 1,
          explanation: "Baking powder is a mixture of Sodium Hydrogen Carbonate (NaHCO₃) and a mild edible acid like tartaric acid."
        },
        {
          question: "The focal length of a spherical mirror of radius of curvature 30 cm is: / 30 सेमी वक्रता त्रिज्या वाले गोलीय दर्पण की फोकस दूरी होगी:",
          options: ["30 cm", "15 cm", "60 cm", "10 cm"],
          correctAnswer: 1,
          explanation: "Focal length f = R/2 = 30/2 = 15 cm."
        },
        {
          question: "In human males, the testes lie outside the abdominal cavity in the scrotum because: / मानव नर में वृषण उदर गुहा के बाहर वृषण कोष में होते हैं क्योंकि:",
          options: ["It provides protection", "Sperm formation requires 2-2.5°C lower temperature than body", "It facilitates urine flow", "It stores extra hormones"],
          correctAnswer: 1,
          explanation: "Spermatogenesis requires a temperature 2 to 2.5°C lower than normal internal human body temperature."
        }
      ];

      validQuestions = emergencyPool;
    }

    const finalQuestions = validQuestions.slice(0, questionCount);

    return res.status(200).json({
      success: true,
      model: usedModel,
      organization_id: organization, // Echoes the locked tenant ID
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
