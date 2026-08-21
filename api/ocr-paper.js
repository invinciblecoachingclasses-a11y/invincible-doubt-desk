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
    const { 
      inputType, // 'camera', 'text', 'ncert'
      rawText, 
      imageBase64Array, 
      subject, 
      classGrade, 
      chapterName, 
      schoolName, 
      totalMarks,
      examType 
    } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let promptContents = [];

    const systemPrompt = `
    You are an expert school examination setter and NCERT curriculum specialist.
    School Name: ${schoolName || "Academic Institution"}
    Class: ${classGrade || "Class 10"}
    Subject: ${subject || "General Science"}
    Chapter/Topic: ${chapterName || "General Curriculum"}
    Target Marks: ${totalMarks || 25}
    Assessment Type: ${examType || "Unit Test / Formative"}

    TASK:
    - If images are provided: Transcribe questions accurately, fix phrasing, allocate marks, and generate step solutions.
    - If raw pasted text is provided: Extract and restructure questions into a clean exam blueprint.
    - If NCERT topic/chapter is provided: Generate authentic, latest NCERT-standard exercise and HOTS (High Order Thinking Skills) questions based on standard curriculum.
    - Allocate marks per section (Section A: 1-2 marks, Section B: 3-5 marks).
    - Provide a complete step-by-step Answer Key and Marking Scheme for the teacher.

    Respond ONLY with valid JSON in this exact structure without markdown backticks:
    {
      "school_name": "${schoolName || "Academic Institution"}",
      "title": "${examType || "Periodic Assessment"}",
      "subject": "${subject || "Mathematics"}",
      "class_grade": "${classGrade || "Class 10"}",
      "total_marks": ${totalMarks || 25},
      "duration_minutes": 45,
      "instructions": [
        "All questions are compulsory.",
        "Marks are allocated against each section."
      ],
      "sections": [
        {
          "section_name": "Section A",
          "questions": [
            {
              "question_number": 1,
              "question_text": "Sample question text here...",
              "marks": 2,
              "answer_key": "Step 1: ..., Step 2: ... Final answer."
            }
          ]
        }
      ]
    }
    `;

    promptContents.push(systemPrompt);

    if (inputType === 'text' || inputType === 'ncert') {
      promptContents.push(`Context / Content Input: ${rawText || chapterName}`);
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

    const result = await model.generateContent(promptContents);
    const responseText = result.response.text().trim();
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const examData = JSON.parse(cleanedText);

    return res.status(200).json({ success: true, exam: examData });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
