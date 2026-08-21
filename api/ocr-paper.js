import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

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

    // Use latest compatible model identifier
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    let promptContents = [];

    const systemPrompt = `
    You are an expert school examination setter and NCERT curriculum specialist.
    School Name: ${schoolName || "Academic Institution"}
    Class: ${classGrade || "Class 10"}
    Subject: ${subject || "Science"}
    Chapter/Topic: ${chapterName || "Curriculum"}
    Target Marks: ${totalMarks || 25}
    Assessment Type: ${examType || "Unit Test"}

    TASK:
    - If NCERT topic/chapter is provided: Create standard NCERT & CBSE board format questions (MCQ, Short Answer, Long Answer) covering key concepts.
    - If pasted text/images are provided: Structure the questions cleanly into formal sections.
    - Allocate marks properly across sections.
    - Provide complete step-by-step marking keys for every question.

    Respond ONLY with raw JSON without markdown backticks:
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
          "section_name": "Section A (Short Questions)",
          "questions": [
            {
              "question_number": 1,
              "question_text": "Sample question text here...",
              "marks": 2,
              "answer_key": "Step-by-step marking answer."
            }
          ]
        }
      ]
    }
    `;

    promptContents.push(systemPrompt);

    if (inputType === 'text' || inputType === 'ncert') {
      promptContents.push(`Topic Details: ${chapterName || rawText}`);
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
