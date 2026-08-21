import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sheetImagesBase64, examData } = req.body;

    if (!sheetImagesBase64 || sheetImagesBase64.length === 0) {
      return res.status(400).json({ error: "No student answer sheet photos provided" });
    }

    const imageParts = sheetImagesBase64.map((b64) => ({
      inlineData: {
        data: b64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: "image/jpeg",
      },
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an expert school teacher evaluating a student's handwritten answer sheet.
    
    Here is the Master Question Paper and Marking Scheme:
    ${JSON.stringify(examData || {}, null, 2)}

    TASK:
    1. Extract Student Name and Roll Number from the top of the sheet (if visible).
    2. Carefully match the student's handwritten answers to each question in the marking scheme.
    3. Grade step-by-step logic, formula application, and final answers. Award partial marks where appropriate.
    4. Provide concise teacher feedback explaining any point deductions.

    Respond ONLY with valid JSON in this exact structure without markdown backticks:
    {
      "student_name": "Student Name or Unknown",
      "roll_number": "Roll No or Unknown",
      "total_marks_obtained": 18,
      "max_marks": 25,
      "question_evaluations": [
        {
          "question_number": 1,
          "marks_awarded": 2,
          "max_marks": 2,
          "feedback": "Accurate definition and correct formula stated."
        }
      ]
    }
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text().trim();
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const evaluation = JSON.parse(cleanedText);

    return res.status(200).json({ success: true, evaluation });
  } catch (error) {
    console.error("Grading Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
