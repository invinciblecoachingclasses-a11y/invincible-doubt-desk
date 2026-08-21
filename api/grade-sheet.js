export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: "GEMINI_API_KEY missing in Vercel." });
  }

  try {
    const { imageBase64, examData } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "No student answer sheet image provided." });
    }

    const promptText = `
You are an expert school teacher evaluating a handwritten student answer sheet.

Master Question Paper and Marking Scheme:
${JSON.stringify(examData || {}, null, 2)}

TASK:
1. Extract Student Name and Roll Number if written on top.
2. Match the student's handwritten answers to the corresponding questions in the marking scheme.
3. Grade step-by-step logic, formulas, and final answers, awarding partial marks accurately.
4. Provide constructive feedback explaining where marks were deducted.

Respond ONLY with valid, raw JSON (no backticks, no markdown prefix):
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

    const parts = [
      { text: promptText },
      {
        inline_data: {
          mime_type: "image/jpeg",
          data: imageBase64.replace(/^data:image\/\w+;base64,/, "")
        }
      }
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || JSON.stringify(data));
    }

    const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanJson = rawOutput.replace(/```json/g, "").replace(/```/g, "").trim();
    const evaluation = JSON.parse(cleanJson);

    return res.status(200).json({ success: true, evaluation });
  } catch (error) {
    console.error("Grading API Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
