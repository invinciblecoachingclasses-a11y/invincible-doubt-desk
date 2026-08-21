export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: "GEMINI_API_KEY is not set in Vercel Environment Variables." });
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
2. Structure sections clearly: Section A (Objective/Short), Section B (Short Answer), Section C (Long/Application).
3. Include question numbers, mark allocations totaling ${totalMarks || 25}, and step-by-step marking answers.

Respond ONLY with valid, raw JSON without markdown backticks:
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
      "section_name": "Section A",
      "questions": [
        {
          "question_number": 1,
          "question_text": "Sample Question",
          "marks": 2,
          "answer_key": "Model answer steps."
        }
      ]
    }
  ]
}
`;

    let parts = [{ text: systemPrompt }];

    if (inputType === 'text' || inputType === 'ncert') {
      parts.push({ text: `Topic: ${chapterName || rawText}` });
    }

    if (imageBase64Array && imageBase64Array.length > 0) {
      imageBase64Array.forEach((b64) => {
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: b64.replace(/^data:image\/\w+;base64,/, "")
          }
        });
      });
    }

    // Direct REST call to Gemini 2.0 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || JSON.stringify(data));
    }

    const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanJson = rawOutput.replace(/```json/g, "").replace(/```/g, "").trim();
    const examData = JSON.parse(cleanJson);

    return res.status(200).json({ success: true, exam: examData });
  } catch (error) {
    console.error("OCR Paper Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
