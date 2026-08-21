import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
      examType 
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: "GEMINI_API_KEY is missing in Vercel Environment Variables." });
    }

    const systemPrompt = `
You are an expert school examination setter for Indian schools (CBSE / NCERT / State Boards).
School Name: ${schoolName || "Academic Institution"}
Class: ${classGrade || "Class 10"}
Subject: ${subject || "Science"}
Topic / Chapter: ${chapterName || rawText || "Standard Curriculum"}
Target Marks: ${totalMarks || 25}
Exam Type: ${examType || "Periodic Test"}

INSTRUCTIONS:
1. Create a balanced, high-quality school exam paper tailored to this topic and class level.
2. Structure sections clearly: Section A (MCQs / Very Short), Section B (Short Answer), Section C (Long / Application).
3. Include accurate question numbers, mark allocations per question totaling ${totalMarks || 25}, and a step-by-step model marking answer for every question.

Respond ONLY with valid, raw JSON (no backticks, no markdown prefix):
{
  "school_name": "${schoolName || "Academic Institution"}",
  "title": "${examType || "Periodic Assessment"}",
  "subject": "${subject || "Science"}",
  "class_grade": "${classGrade || "Class 10"}",
  "total_marks": ${totalMarks || 25},
  "duration_minutes": 45,
  "instructions": [
    "All questions are compulsory.",
    "Marks are indicated against each question."
  ],
  "sections": [
    {
      "section_name": "Section A (Objective & Short)",
      "questions": [
        {
          "question_number": 1,
          "question_text": "Write a balanced chemical equation for the reaction between Zinc and dilute Sulphuric Acid.",
          "marks": 2,
          "answer_key": "Zn + H2SO4 -> ZnSO4 + H2 ^ (1 mark for equation, 1 mark for state/balancing)"
        }
      ]
    }
  ]
}
`;

    let promptContents = [systemPrompt];

    if (inputType === 'text' || inputType === 'ncert') {
      promptContents.push(`Topic: ${chapterName || rawText}`);
    }

    if (imageBase64Array && imageBase64Array.length > 0) {
      const imageParts = imageBase64Array.map((b64) => ({
        inlineData: {
          data: b64.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: "image/jpeg",
        },
      }));
      promptContents.push(...imageParts);
    }

    // Try primary models with automatic fallback
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
      throw new Error(lastErr ? lastErr.message : "Failed to generate exam from Gemini models.");
    }

    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const examData = JSON.parse(cleanedText);

    return res.status(200).json({ success: true, exam: examData });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
