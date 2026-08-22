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
      examType,
      durationMinutes,
      academicSession,
      setCode,
      includeStudentBlanks,
      difficulty,
      includeMCQs,
      includeAssertionReason,
      includeCaseStudy,
      isBilingual
    } = req.body;

    const systemPrompt = `
You are an expert school examination setter for Indian schools (CBSE / NCERT / ICSE / State Boards).

EXAM SPECIFICATIONS:
- School / Institute: ${schoolName || "Academic Institution"}
- Class: ${classGrade || "Class 10"}
- Subject: ${subject || "Science"}
- Syllabus / Chapters / Topics: ${chapterName || rawText || "Standard Curriculum"}
- Total Marks: ${totalMarks || 25}
- Exam Type: ${examType || "Periodic Test"}
- Duration: ${durationMinutes || 45} Minutes
- Academic Session / Date: ${academicSession || "2025-26"}
- Set Code: ${setCode || "None"}
- Difficulty Level: ${difficulty || "Standard"}
- Include MCQs (4 options A, B, C, D): ${includeMCQs ? "YES" : "NO"}
- Include Assertion-Reason: ${includeAssertionReason ? "YES" : "NO"}
- Include Case-Based / Passage Questions: ${includeCaseStudy ? "YES" : "NO"}
- Bilingual (English + Hindi): ${isBilingual ? "YES" : "NO"}

INSTRUCTIONS:
1. Generate an authentic school question paper perfectly matching the Indian board format.
2. Sum of marks across all questions MUST equal exactly ${totalMarks || 25}.
3. Structure sections strictly:
   - Section A: MCQs (1 Mark each, with options A, B, C, D) and/or Assertion-Reason.
   - Section B: Very Short Answer (2 Marks).
   - Section C: Short Answer (3 Marks).
   - Section D: Long Answer (5 Marks) / Case-Based Integrated Study (4-5 Marks).
4. Provide comprehensive, step-by-step marking keys for each question (e.g., Step 1: formula, Step 2: calculation, Step 3: units). For MCQs, state the correct option letter + brief justification.

Respond ONLY with valid, raw JSON (NO markdown backticks, NO markdown formatting):
{
  "school_name": "${schoolName || "Academic Institution"}",
  "title": "${examType || "Periodic Assessment"}",
  "subject": "${subject || "Science"}",
  "class_grade": "${classGrade || "Class 10"}",
  "total_marks": ${totalMarks || 25},
  "duration_minutes": ${durationMinutes || 45},
  "academic_session": "${academicSession || "2025-26"}",
  "set_code": "${setCode || ""}",
  "has_student_blanks": ${includeStudentBlanks ? "true" : "false"},
  "instructions": [
    "All questions are compulsory.",
    "Section A contains Objective/MCQ questions carrying 1 mark each.",
    "Section B, C, and D contain subjective questions with step-marking criteria.",
    "Use of calculators or electronic devices is strictly prohibited."
  ],
  "sections": [
    {
      "section_name": "Section A (Objective & MCQs)",
      "questions": [
        {
          "question_number": 1,
          "question_text": "Sample MCQ question text",
          "options": ["(A) Option 1", "(B) Option 2", "(C) Option 3", "(D) Option 4"],
          "marks": 1,
          "answer_key": "(B) Option 2 - Step-by-step explanation or rationale."
        }
      ]
    }
  ]
}
`;

    let parts = [{ text: systemPrompt }];

    if (inputType === 'text' || inputType === 'ncert') {
      parts.push({ text: `Detailed Curriculum / Source Input:\n${chapterName || rawText}` });
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

    // Direct API call to Gemini 2.5/2.0 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
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
