import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, examData } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: "GEMINI_API_KEY missing in Vercel" });
    }

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "No student answer sheet image provided." });
    }

    const prompt = `
You are an expert school teacher evaluating a handwritten student answer sheet.

Master Question Paper and Marking Scheme:
${JSON.stringify(examData || {}, null, 2)}

TASK:
1. Extract Student Name and Roll Number if written on top.
2. Match the student's handwritten answers to the corresponding questions in the marking scheme.
3. Grade step-by-step logic, formulas, and final answers, awarding partial marks accurately.
4. Provide constructive feedback explaining where marks were deducted.

Respond ONLY with valid, raw JSON (no backticks, no markdown):
{
  "student_name": "Student Name or Unknown",
  "roll_number": "Roll No or Unknown",
  "total_score_obtained": 18,
  "total_max_marks": 25,
  "teacher_summary": "Good overall effort. Needs to focus on balanced chemical equations.",
  "graded_questions": [
    {
      "question_number": 1,
      "max_marks": 2,
      "marks_awarded": 1.5,
      "student_answer_extracted": "Student wrote Zn + H2SO4 = ZnSO4",
      "status": "Partial",
      "feedback": "Missed indicating hydrogen gas evolution symbol."
    }
  ]
}
`;

    const imagePart = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: "image/jpeg",
      },
    };

    const promptContents = [prompt, imagePart];

    // Fallback across active models
    const candidateModels = ["gemini-2.0-flash", "gemini-1.5-flash-002", "gemini-1.5-flash", "gemini-1.5-pro"];
    let responseText = null;
    let lastErr = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(promptContents);
        responseText = result.response.text().trim();
        if (responseText) break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!responseText) {
      throw new Error(lastErr ? lastErr.message : "Grading failed.");
    }

    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const evaluation = JSON.parse(cleanedText);

    return res.status(200).json({ success: true, evaluation });
  } catch (error) {
    console.error("Grading API Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
