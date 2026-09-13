// api/ocr-paper.js
export const maxDuration = 60;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const rawGeminiKeys =
    process.env.GEMINI_API_KEYS ||
    process.env.GEMINI_API_KEY;

  if (!rawGeminiKeys) {
    return res.status(500).json({
      success: false,
      error: "GEMINI_API_KEY is not configured in environment variables."
    });
  }

  const geminiKeys = rawGeminiKeys
    .split(",")
    .map(k => k.trim())
    .filter(Boolean);

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

    const images =
      Array.isArray(imageBase64Array)
        ? imageBase64Array.filter(Boolean)
        : [];

    const sourcePageCount = images.length;

    /*
      ============================================================
      IMPORTANT OCR RULE

      This endpoint is TRANSCRIPTION, not creative generation.

      Every uploaded image represents one source page.
      Gemini must inspect every page and preserve every question,
      sub-question, section and mark allocation.
      ============================================================
    */

    const systemPrompt = `
You are an expert Examination Paper OCR and Transcription Engine.

THIS IS AN EXACT TRANSCRIPTION TASK.

You are given an examination paper as one or more page images.

Your primary responsibility is to reproduce the COMPLETE paper
shown in the supplied images.

ABSOLUTELY DO NOT:
- invent questions
- create replacement questions
- summarize questions
- shorten questions
- skip questions
- skip sub-questions
- skip sections
- skip options
- skip instructions
- change marks
- merge separate questions
- silently discard unclear content

Every visible page must be processed.

SOURCE PAGE COUNT:
${sourcePageCount}

You MUST inspect all ${sourcePageCount} supplied page image(s).

For each source page:
1. Read the complete page from top to bottom.
2. Identify every question and sub-question.
3. Preserve its original question number.
4. Preserve all options.
5. Preserve all marks.
6. Preserve section names.
7. Preserve instructions.
8. Preserve tables, matching questions and case-study structure.
9. Continue to the next page only after checking the entire current page.

COMPLETENESS IS MORE IMPORTANT THAN BREVITY.

If a question continues onto the next page, keep it as one logical
question while preserving all of its visible content.

Do not stop after finding an apparently complete examination section.

EXAM METADATA:
- School / Institute: ${schoolName || "Invincible Coaching Classes"}
- Class: ${classGrade || "Class 4"}
- Subject: ${subject || "E.V.S"}
- Requested Total Marks: ${totalMarks || 80}
- Exam Type: ${examType || "Summative Assessment (SA-1)"}
- Duration: ${durationMinutes || 150} Minutes

MARKS RULE:

For OCR mode, the marks printed in the source paper are authoritative.

Do NOT modify the marks merely to make them equal to the requested
total marks.

At the end, calculate:

TOTAL_TRANSCRIBED_MARKS =
sum of the marks of every top-level question/sub-question exactly
as represented in the source.

If the source paper itself says a different total, preserve the
source information rather than inventing marks.

QUESTION NUMBER RULES:

Preserve original numbering exactly where possible.

Examples:
1, 2, 3
21(a), 21(b)
Q1, Q2
Section A: 1-10

Do not renumber the source paper merely for convenience.

MATCH THE FOLLOWING:

Keep Column A and Column B clearly separated.

Use Unicode non-breaking spaces where necessary.

CASE STUDIES:

Preserve:
- passage
- sub-parts
- options
- marks
- numbering

MULTIPLE CHOICE QUESTIONS:

Preserve all options exactly.

ANSWER KEYS:

Provide an answer key for every transcribed question when it can be
determined from the source and standard curriculum.

Do not remove a question merely because its answer is difficult.

OCR UNCERTAINTY:

If a small portion is genuinely unreadable, preserve the readable
text and use "[unclear]" only for the unreadable portion.

Never replace an unreadable question with a newly invented question.

FINAL COMPLETENESS CHECK:

Before responding, internally verify:

1. Number of source pages received = ${sourcePageCount}
2. Every source page was inspected.
3. No source page was skipped.
4. Every visible question was transcribed.
5. Every visible sub-question was transcribed.
6. Every visible option was transcribed.
7. Every visible mark allocation was preserved.
8. The final JSON contains all extracted sections and questions.

Respond ONLY with valid raw JSON.

JSON SCHEMA:

{
  "school_name": "${schoolName || "Invincible Coaching Classes"}",
  "title": "${examType || "Summative Assessment (SA-1)"}",
  "subject": "${subject || "E.V.S"}",
  "class_grade": "${classGrade || "Class 4"}",
  "total_marks": ${Number(totalMarks) || 80},
  "duration_minutes": ${Number(durationMinutes) || 150},
  "academic_session": "${academicSession || "2025-26"}",
  "set_code": "${setCode || ""}",
  "source_page_count": ${sourcePageCount},
  "transcribed_question_count": 0,
  "transcribed_total_marks": 0,
  "has_student_blanks": ${includeStudentBlanks !== false},
  "instructions": [],
  "sections": [
    {
      "section_name": "SECTION A",
      "questions": [
        {
          "question_number": 1,
          "question_text": "Complete question text",
          "options": [],
          "marks": 1,
          "answer_key": "Answer"
        }
      ]
    }
  ]
}

The values 0 in the example are placeholders.
Replace them with the ACTUAL calculated values.

Again:

PROCESS ALL ${sourcePageCount} SOURCE PAGES.
DO NOT STOP EARLY.
DO NOT SUMMARIZE.
DO NOT INVENT.
DO NOT OMIT.
`;

    const parts = [
      {
        text: systemPrompt
      }
    ];

    if (
      inputType === "text" ||
      rawText ||
      chapterName
    ) {
      parts.push({
        text:
          `Additional Context / Notes:\n${
            chapterName || rawText || ""
          }`
      });
    }

    /*
      Send every uploaded page image.
      We deliberately preserve the existing image compression
      and data-url handling.
    */
    images.forEach((b64, index) => {
      parts.push({
        text:
          `\nSOURCE PAGE ${index + 1} OF ${sourcePageCount}\n`
      });

      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: String(b64)
            .replace(
              /^data:image\/\w+;base64,/,
              ""
            )
        }
      });
    });

    const MODELS = [
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite"
    ];

    let examData = null;
    const errorLog = [];

    keyLoop:
    for (const key of geminiKeys) {
      for (const model of MODELS) {
        try {
          const url =
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts
                }
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.05
              }
            })
          });

          const data = await response.json();

          if (
            response.ok &&
            data?.candidates?.[0]?.content?.parts?.[0]?.text
          ) {
            const rawOutput =
              data.candidates[0]
                .content.parts[0].text;

            const cleanJson =
              rawOutput
                .replace(
                  /^```json\s*/i,
                  ""
                )
                .replace(
                  /^```\s*/i,
                  ""
                )
                .replace(
                  /\s*```$/i,
                  ""
                )
                .trim();

            try {
              examData =
                JSON.parse(cleanJson);
            } catch (parseError) {
              errorLog.push(
                `Gemini [${model}]: Invalid JSON response`
              );
              continue;
            }

            break keyLoop;

          } else {
            errorLog.push(
              `Gemini [${model}]: ${
                data?.error?.message ||
                response.statusText
              }`
            );
          }

        } catch (err) {
          errorLog.push(
            `Gemini [${model}]: ${err.message}`
          );
        }
      }
    }

    if (!examData) {
      return res.status(500).json({
        success: false,
        error:
          `OCR Question Paper transcription failed: ${
            errorLog.slice(0, 3).join(" | ")
          }`
      });
    }

    /*
      ============================================================
      SERVER-SIDE COMPLETENESS NORMALIZATION
      ============================================================
    */

    if (!Array.isArray(examData.sections)) {
      examData.sections = [];
    }

    let questionCount = 0;
    let calculatedMarks = 0;

    examData.sections.forEach(section => {
      if (!Array.isArray(section.questions)) {
        section.questions = [];
      }

      section.questions.forEach(question => {
        questionCount++;

        const marks =
          Number(question.marks);

        if (
          Number.isFinite(marks) &&
          marks > 0
        ) {
          calculatedMarks += marks;
        }
      });
    });

    examData.source_page_count =
      sourcePageCount;

    examData.transcribed_question_count =
      questionCount;

    examData.transcribed_total_marks =
      calculatedMarks;

    /*
      IMPORTANT:
      Do not silently change the source marks.
      This is OCR, so the source paper remains authoritative.
    */

    return res.status(200).json({
      success: true,
      exam: examData
    });

  } catch (error) {
    console.error(
      "OCR Paper Fatal Error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Server error processing examination paper."
    });
  }
}