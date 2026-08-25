// api/grade-sheet.js
export const maxDuration = 60; // Allows Vercel full timeout window for vision-based grading

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
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawGeminiKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
  if (!rawGeminiKeys) {
    return res.status(500).json({ 
      success: false, 
      error: "GEMINI_API_KEY is not configured in Vercel environment variables." 
    });
  }

  const geminiKeys = rawGeminiKeys.split(",").map(k => k.trim()).filter(Boolean);

  try {
    const { imageBase64, examData } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ 
        success: false, 
        error: "No student answer sheet image provided." 
      });
    }

    const promptText = `
You are an expert school board examiner evaluating a handwritten student answer sheet.

Master Question Paper and Marking Scheme:
${JSON.stringify(examData || {}, null, 2)}

EVALUATION TASK:
1. Extract Student Name and Roll Number if clearly written on the header.
2. Accurately map each student handwritten response to the respective question in the marking scheme.
3. Award marks based on step-by-step logic, correct units, balanced chemical equations, and intermediate formulas.
4. Offer concise, constructive feedback pointing out where marks were lost.

Respond ONLY with valid, raw JSON:
{
  "student_name": "Extracted Name or Unknown",
  "roll_number": "Extracted Roll No or Unknown",
  "total_score_obtained": 18,
  "total_max_marks": 25,
  "teacher_summary": "Overall assessment summary with actionable guidance.",
  "graded_questions": [
    {
      "question_number": 1,
      "max_marks": 2,
      "marks_awarded": 1.5,
      "student_answer_extracted": "Student response summary",
      "status": "Partial",
      "feedback": "Step reasoning explanation"
    }
  ]
}
`;

    const parts = [
      { text: promptText },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: String(imageBase64).replace(/^data:image\/\w+;base64,/, "")
        }
      }
    ];

    // Multi-model resilience hierarchy for visual OCR grading
    const MODELS = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b"
    ];

    let evaluation = null;
    let errorLog = [];

    keyLoop: for (const key of geminiKeys) {
      for (const model of MODELS) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.15
              }
            })
          });

          const data = await response.json();
          if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const rawOutput = data.candidates[0].content.parts[0].text;
            const cleanJson = rawOutput
              .replace(/^```json\s*/i, "")
              .replace(/^```\s*/i, "")
              .replace(/\s*```$/i, "")
              .trim();

            evaluation = JSON.parse(cleanJson);
            break keyLoop;
          } else {
            errorLog.push(`Gemini [${model}]: ${data?.error?.message || response.statusText}`);
          }
        } catch (err) {
          errorLog.push(`Gemini [${model}]: ${err.message}`);
        }
      }
    }

    if (!evaluation) {
      return res.status(500).json({
        success: false,
        error: `Grading evaluation failed across endpoints: ${errorLog.slice(0, 2).join(" | ")}`
      });
    }

    return res.status(200).json({ 
      success: true, 
      evaluation 
    });

  } catch (error) {
    console.error("Grading API Server Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Internal server error evaluating answer sheet." 
    });
  }
}
