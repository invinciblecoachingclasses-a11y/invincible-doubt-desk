import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== "POST") {
    return res.status(455).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64Array, subject, classGrade, schoolName, totalMarks } = req.body;

    if (!imageBase64Array || imageBase64Array.length === 0) {
      return res.status(400).json({ error: "No draft images provided" });
    }

    // Format images for Gemini Vision
    const imageParts = imageBase64Array.map((b64) => ({
      inlineData: {
        data: b64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: "image/jpeg",
      },
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an expert examination setter. Analyze these photos of a teacher's handwritten test draft or textbook pages.
    School Name: ${schoolName || "Standard Examination"}
    Subject: ${subject || "General"}
    Class: ${classGrade || "Standard"}
    Target Marks: ${totalMarks || "Auto"}

    TASK:
    1. Transcribe all handwritten questions accurately.
    2. Convert all mathematical/scientific formulas to clean text/LaTeX.
    3. Fix grammatical mistakes and polish phrasing.
    4. Group into structured sections (e.g., Section A: Short Answer, Section B: Long Answer).
    5. Allocate realistic marks for each question.
    6. Generate a step-by-step Answer Key and Marking Scheme for the teacher.

    Respond ONLY with valid JSON in this exact structure without markdown backticks:
    {
      "school_name": "${schoolName || "Examination"}",
      "title": "Unit Assessment",
      "subject": "${subject}",
      "class_grade": "${classGrade}",
      "total_marks": 25,
      "duration_minutes": 45,
      "instructions": [
        "All questions are compulsory.",
        "Marks are indicated against each question."
      ],
      "sections": [
        {
          "section_name": "Section A",
          "questions": [
            {
              "question_number": 1,
              "question_text": "Define Newton's Second Law of Motion.",
              "marks": 2,
              "answer_key": "Force is equal to mass multiplied by acceleration (F = ma)."
            }
          ]
        }
      ]
    }
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text().trim();
    
    // Clean response of any unwanted markdown ticks if present
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const examData = JSON.parse(cleanedText);

    return res.status(200).json({ success: true, exam: examData });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
