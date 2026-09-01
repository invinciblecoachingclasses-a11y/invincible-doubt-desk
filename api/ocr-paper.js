// api/ocr-paper.js
export const maxDuration = 60; // Allows Vercel full timeout window for multi-image OCR extraction

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
      error: "GEMINI_API_KEY is not configured in environment variables." 
    });
  }

  const geminiKeys = rawGeminiKeys.split(",").map(k => k.trim()).filter(Boolean);

  try {
    const { 
      inputType,
      rawText, 
      imageBase64Array, 
      subject, 
      classGrade, 
      chapterName, 
      schoolName, 
      totalMarks,
      examType,
      durationMinutes,
      academicSession,
      setCode,
      includeStudentBlanks
    } = req.body || {};

    const systemPrompt = `
You are an expert OCR Transcription and Examination Formatting Engine. Your task is to accurately transcribe the handwritten question paper from the provided images word-for-word, preserving every section, question number, option, sub-part, and mark allocation exactly as written on the paper. Do NOT invent, generate, or create new questions. Transcribe precisely what is shown in the images.

EXAM METADATA:
- School / Institute: ${schoolName || "Invincible Coaching Classes"}
- Class: ${classGrade || "Class 4"}
- Subject: ${subject || "E.V.S"}
- Total Marks: ${totalMarks || 80}
- Exam Type: ${examType || "Summative Assessment (SA-1)"}
- Duration: ${durationMinutes || 150} Minutes

INSTRUCTIONS:
1. Extract all sections (e.g., Section A, Section B, Section C, Section D, Section E, Section F, Section G) exactly as presented in the images.
2. Transcribe every question text, multiple-choice options (a, b, c, d), fill-in blanks, true/false statements, and subjective questions with absolute fidelity.
3. Preserve the exact marks indicated for each question or section.
4. Provide accurate answer keys for each transcribed question based on standard academic curriculum.
5. CRITICAL FOR "MATCH THE FOLLOWING": Do NOT flatten matching questions into a single line. Format them cleanly as a list in the "options" array so Column A and Column B sit on their own individual lines.

Respond ONLY with valid, raw JSON matching this exact schema:
{
  "school_name": "${schoolName || "Invincible Coaching Classes"}",
  "title": "${examType || "Summative Assessment (SA-1)"}",
  "subject": "${subject || "E.V.S"}",
  "class_grade": "${classGrade || "Class 4"}",
  "total_marks": ${totalMarks || 80},
  "duration_minutes": ${durationMinutes || 150},
  "academic_session": "${academicSession || "2025-26"}",
  "set_code": "${setCode || ""}",
  "has_student_blanks": true,
  "instructions": [
    "All questions are compulsory.",
    "Write neat and legible answers. Diagrams must be drawn clearly where required."
  ],
  "sections": [
    {
      "section_name": "SECTION D - Match the Following",
      "questions": [
        {
          "question_number": 1,
          "question_text": "Match Column A with Column B:",
          "options": [
            "1. Doctor         (a) Milk",
            "2. Teacher        (b) Water",
            "3. Cow            (c) Hospital",
            "4. Fish           (d) Light",
            "5. Sun            (e) School"
          ],
          "marks": 10,
          "answer_key": "1-(c), 2-(e), 3-(a), 4-(b), 5-(d)"
        }
      ]
    }
  ]
}
`;

    const parts = [{ text: systemPrompt }];

    if (inputType === 'text' || rawText || chapterName) {
      parts.push({ text: `Additional Context / Notes:\n${chapterName || rawText || ""}` });
    }

    if (imageBase64Array && Array.isArray(imageBase64Array) && imageBase64Array.length > 0) {
      imageBase64Array.forEach((b64) => {
        if (b64) {
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: String(b64).replace(/^data:image\/\w+;base64,/, "")
            }
          });
        }
      });
    }

    // Multi-model resilience hierarchy utilizing current available models
    const MODELS = [
      "gemini-3.6-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b"
    ];

    let examData = null;
    let errorLog = [];

    keyLoop: for (const key of geminiKeys) {
      for (const model of MODELS) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
          
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1
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
            
            examData = JSON.parse(cleanJson);
            break keyLoop;
          } else {
            errorLog.push(`Gemini [${model}]: ${data?.error?.message || response.statusText}`);
          }
        } catch (err) {
          errorLog.push(`Gemini [${model}]: ${err.message}`);
        }
      }
    }

    if (!examData) {
      return res.status(500).json({ 
        success: false, 
        error: `OCR Question Paper transcription failed: ${errorLog.slice(0, 2).join(" | ")}` 
      });
    }

    return res.status(200).json({ 
      success: true, 
      exam: examData 
    });

  } catch (error) {
    console.error("OCR Paper Fatal Error:", error);
    return res.status(500).json({ success: false, error: error.message || "Server error processing handwritten paper." });
  }
}
