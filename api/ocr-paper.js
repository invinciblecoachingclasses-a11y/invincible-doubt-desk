// api/ocr-paper.js
// Faculty Studio — OCR + Exact-Mark Examination Generator
//
// IMPORTANT:
// 1. Camera/Photos = exact OCR/transcription.
// 2. Multi-Chapter Syllabus + Paste Text = NEW EXAM GENERATION.
// 3. Generated papers are accepted only when the server-calculated
//    marks exactly equal the requested total.
// 4. This keeps OCR faithful while preventing 70/80-type papers.

export const maxDuration = 60;

const MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite"
];

function numberOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function cleanText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function stripJsonFences(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function calculateMarks(exam) {
  let total = 0;
  let count = 0;

  const sections = Array.isArray(exam?.sections)
    ? exam.sections
    : [];

  for (const section of sections) {
    const questions = Array.isArray(section?.questions)
      ? section.questions
      : [];

    for (const q of questions) {
      const marks = Number(q?.marks);

      if (Number.isFinite(marks) && marks > 0) {
        total += marks;
      }

      count += 1;
    }
  }

  return { total, count };
}

function normalizeExam(exam, meta) {
  const normalized =
    exam && typeof exam === "object"
      ? exam
      : {};

  if (!Array.isArray(normalized.sections)) {
    normalized.sections = [];
  }

  normalized.sections =
    normalized.sections.map((section, si) => {
      const s =
        section && typeof section === "object"
          ? section
          : {};

      if (!Array.isArray(s.questions)) {
        s.questions = [];
      }

      s.section_name =
        cleanText(
          s.section_name,
          `SECTION ${String.fromCharCode(65 + si)}`
        );

      s.questions =
        s.questions.map((q, qi) => {
          const item =
            q && typeof q === "object"
              ? q
              : {};

          const marks =
            Number(item.marks);

          return {
            question_number:
              item.question_number ??
              item.questionNumber ??
              qi + 1,

            question_text:
              cleanText(
                item.question_text ??
                item.question ??
                item.text
              ),

            options:
              Array.isArray(item.options)
                ? item.options.map(v => String(v))
                : [],

            marks:
              Number.isFinite(marks) && marks > 0
                ? marks
                : 1,

            answer_key:
              item.answer_key ??
              item.answer ??
              "",

            topic:
              cleanText(item.topic),

            concept:
              cleanText(item.concept),

            sub_questions:
              Array.isArray(item.sub_questions)
                ? item.sub_questions
                : []
          };
        });

      return s;
    });

  const stats =
    calculateMarks(normalized);

  normalized.school_name =
    meta.schoolName;

  normalized.title =
    meta.examType;

  normalized.subject =
    meta.subject;

  normalized.class_grade =
    meta.classGrade;

  normalized.total_marks =
    meta.totalMarks;

  normalized.duration_minutes =
    meta.durationMinutes;

  normalized.academic_session =
    meta.academicSession;

  normalized.set_code =
    meta.setCode;

  normalized.has_student_blanks =
    meta.includeStudentBlanks;

  normalized.generated_question_count =
    stats.count;

  normalized.generated_total_marks =
    stats.total;

  return normalized;
}


/*
  Deterministic exact-mark blueprints.

  These are used for generation mode only.
  OCR mode never uses them.

  Common school totals:

  25 = 5×1 + 5×2 + 2×5
  40 = 8×1 + 6×2 + 4×3 + 2×4
  50 = 10×1 + 5×2 + 5×3 + 3×5
  80 = 10×1 + 5×2 + 5×3 + 4×5 + 2×10
  100 = 10×1 + 10×2 + 10×3 + 4×5 + 2×10
*/
function buildMarksBlueprint(target) {
  const t =
    Math.max(
      1,
      Math.round(Number(target) || 80)
    );

  const common = {
    25: [
      { marks: 1, count: 5 },
      { marks: 2, count: 5 },
      { marks: 5, count: 2 }
    ],

    40: [
      { marks: 1, count: 8 },
      { marks: 2, count: 6 },
      { marks: 3, count: 4 },
      { marks: 4, count: 2 }
    ],

    50: [
      { marks: 1, count: 10 },
      { marks: 2, count: 5 },
      { marks: 3, count: 5 },
      { marks: 5, count: 3 }
    ],

    80: [
      { marks: 1, count: 10 },
      { marks: 2, count: 5 },
      { marks: 3, count: 5 },
      { marks: 5, count: 4 },
      { marks: 10, count: 2 }
    ],

    100: [
      { marks: 1, count: 10 },
      { marks: 2, count: 10 },
      { marks: 3, count: 10 },
      { marks: 5, count: 4 },
      { marks: 10, count: 2 }
    ]
  };

  if (common[t]) {
    return common[t];
  }

  const result = [];
  let remaining = t;

  for (const mark of [10, 5, 4, 3, 2, 1]) {
    if (remaining <= 0) {
      break;
    }

    const count =
      Math.floor(remaining / mark);

    if (count > 0) {
      result.push({
        marks: mark,
        count
      });

      remaining -=
        count * mark;
    }
  }

  return result;
}

function blueprintText(blueprint) {
  return blueprint
    .map(
      item =>
        `${item.count} question(s) × ${item.marks} mark(s)`
    )
    .join("\n");
}

function generationPrompt(meta, blueprint) {
  const context = [
    meta.chapterName
      ? `CHAPTERS / SYLLABUS:\n${meta.chapterName}`
      : "",

    meta.rawText
      ? `SOURCE TEXT / NOTES:\n${meta.rawText}`
      : ""
  ]
    .filter(Boolean)
    .join("\n\n");

  const selectedTypes = [
    meta.includeMCQs
      ? "MCQ"
      : "",

    meta.includeAssertionReason
      ? "Assertion-Reason"
      : "",

    meta.includeCaseStudy
      ? "Case Study"
      : ""
  ]
    .filter(Boolean);

  return `
You are an expert school examination paper generator.

THIS IS A NEW EXAMINATION GENERATION TASK.
It is NOT OCR.

Create a complete, board-appropriate examination paper from the
supplied syllabus/notes.

ACADEMIC INFORMATION
School: ${meta.schoolName}
Class: ${meta.classGrade}
Subject: ${meta.subject}
Exam: ${meta.examType}
Academic session: ${meta.academicSession}
Duration: ${meta.durationMinutes} minutes
Set: ${meta.setCode || "A"}

TARGET TOTAL MARKS: ${meta.totalMarks}

EXACT MARK BLUEPRINT:
${blueprintText(blueprint)}

The blueprint is a HARD requirement.

The sum of marks of every returned top-level question MUST equal
exactly ${meta.totalMarks}.

The count of each mark value MUST exactly match the blueprint.

Do not output 79, 81, 78, 70 or any other total.

QUESTION DESIGN RULES
- Every question must be answerable from the supplied syllabus/notes.
- Use the class level and subject appropriately.
- Do not invent chapters outside the supplied content.
- Avoid duplicate questions.
- Mix recall, understanding, application and higher-order questions
  where appropriate for the class.
- Marks must match the depth and expected answer length.
- A 1-mark question should not require a long answer.
- A 5/10-mark question should have sufficient scope for its marks.
- Keep language clear and examination-ready.
- Number questions sequentially.
- Put questions into logical sections.
- Include answer keys.
- Include topic and concept metadata for every question.

OPTIONAL QUESTION TYPES REQUESTED BY TEACHER:
${
    selectedTypes.length
      ? selectedTypes.join(", ")
      : "No special type required."
  }

If MCQ is requested:
- provide exactly 4 options.
- answer_key must identify the correct option.

If Assertion-Reason is requested:
- use a clear assertion and reason.
- provide standard options and answer key.

If Case Study is requested:
- include a meaningful passage/case.
- include its sub-questions.
- the parent marks must equal the sum of its sub-question marks.

${context}

FINAL VALIDATION BEFORE RESPONSE
1. Count every top-level question.
2. Add every top-level question's marks.
3. Confirm the sum is exactly ${meta.totalMarks}.
4. Confirm the distribution exactly follows the blueprint.
5. Confirm every question has question_text and marks.
6. Confirm no section/question was omitted.

Respond ONLY with valid JSON.

JSON FORMAT:
{
  "school_name": "${meta.schoolName}",
  "title": "${meta.examType}",
  "subject": "${meta.subject}",
  "class_grade": "${meta.classGrade}",
  "total_marks": ${meta.totalMarks},
  "duration_minutes": ${meta.durationMinutes},
  "academic_session": "${meta.academicSession}",
  "set_code": "${meta.setCode}",
  "has_student_blanks": ${meta.includeStudentBlanks},
  "instructions": [],
  "sections": [
    {
      "section_name": "SECTION A",
      "questions": [
        {
          "question_number": 1,
          "question_text": "Question",
          "options": [],
          "marks": 1,
          "answer_key": "Answer",
          "topic": "Topic",
          "concept": "Concept",
          "sub_questions": []
        }
      ]
    }
  ]
}
`;
}

function repairPrompt(
  exam,
  meta,
  blueprint,
  calculated
) {
  return `
You are a strict examination-paper validator and repair engine.

The generated paper below is intended to be a
${meta.totalMarks}-mark paper, but its server-calculated
total is ${calculated}.

Repair the paper so that:

1. It contains the same subject/syllabus intent.
2. It remains appropriate for ${meta.classGrade}.
3. It follows this exact marks blueprint:

${blueprintText(blueprint)}

4. The final sum of ALL returned top-level question marks is exactly
${meta.totalMarks}.
5. Do not simply change the header total.
6. Do not leave any question without marks.
7. Do not delete useful syllabus coverage unnecessarily.
8. Do not invent unrelated content.
9. Preserve answer keys, topic and concept metadata.
10. Return the COMPLETE repaired paper, not a patch.

IMPORTANT:
The server will calculate the total again after your response.
If it is not exactly ${meta.totalMarks}, the paper will be rejected.

CURRENT PAPER:
${JSON.stringify(exam)}

Respond ONLY with valid JSON in the same examination-paper schema.
`;
}

async function callGemini(
  keys,
  prompt,
  temperature = 0.15
) {
  const errors = [];

  for (const key of keys) {
    for (const model of MODELS) {
      try {
        const url =
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

        const response =
          await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: prompt
                    }
                  ]
                }
              ],

              generationConfig: {
                responseMimeType:
                  "application/json",

                temperature
              }
            })
          });

        const data =
          await response.json();

        const text =
          data?.candidates?.[0]
            ?.content?.parts?.[0]
            ?.text;

        if (response.ok && text) {
          try {
            return JSON.parse(
              stripJsonFences(text)
            );
          } catch {
            errors.push(
              `Gemini [${model}]: invalid JSON`
            );
          }
        } else {
          errors.push(
            `Gemini [${model}]: ${
              data?.error?.message ||
              response.statusText
            }`
          );
        }
      } catch (error) {
        errors.push(
          `Gemini [${model}]: ${
            error?.message ||
            "request failed"
          }`
        );
      }
    }
  }

  const error =
    new Error(
      errors.slice(0, 5).join(" | ") ||
      "No Gemini model returned a usable response."
    );

  error.details = errors;

  throw error;
}

async function runGeneration(
  keys,
  meta
) {
  const blueprint =
    buildMarksBlueprint(
      meta.totalMarks
    );

  let exam =
    await callGemini(
      keys,
      generationPrompt(
        meta,
        blueprint
      ),
      0.12
    );

  exam =
    normalizeExam(
      exam,
      meta
    );

  let stats =
    calculateMarks(exam);

  /*
    One controlled repair pass.

    We do NOT silently accept a wrong total.
  */
  if (stats.total !== meta.totalMarks) {
    exam =
      await callGemini(
        keys,
        repairPrompt(
          exam,
          meta,
          blueprint,
          stats.total
        ),
        0.05
      );

    exam =
      normalizeExam(
        exam,
        meta
      );

    stats =
      calculateMarks(exam);
  }

  /*
    Hard server-side total validation.
  */
  if (stats.total !== meta.totalMarks) {
    const error =
      new Error(
        `Generated paper mark validation failed. ` +
        `Requested ${meta.totalMarks}, calculated ${stats.total}.`
      );

    error.code =
      "MARK_TOTAL_MISMATCH";

    error.requested =
      meta.totalMarks;

    error.calculated =
      stats.total;

    throw error;
  }

  /*
    Hard server-side distribution validation.
  */
  const actualDistribution = {};

  for (const section of exam.sections) {
    for (const q of section.questions) {
      const marks =
        Number(q.marks);

      actualDistribution[marks] =
        (actualDistribution[marks] || 0) + 1;
    }
  }

  for (const item of blueprint) {
    if (
      Number(
        actualDistribution[item.marks] || 0
      ) !== Number(item.count)
    ) {
      const error =
        new Error(
          `Generated paper distribution failed. ` +
          `Expected ${item.count}×${item.marks}, ` +
          `received ${actualDistribution[item.marks] || 0}×${item.marks}.`
        );

      error.code =
        "MARK_DISTRIBUTION_MISMATCH";

      throw error;
    }
  }

  exam.generated_total_marks =
    stats.total;

  exam.generated_question_count =
    stats.count;

  exam.mark_blueprint =
    blueprint;

  return exam;
}

async function runOCR(
  keys,
  meta,
  images
) {
  const sourcePageCount =
    images.length;

  const prompt = `
You are an expert Examination Paper OCR and Transcription Engine.

THIS IS AN EXACT TRANSCRIPTION TASK.

Process EVERY supplied page image.

DO NOT:
- invent questions
- replace questions
- summarize
- shorten
- skip questions
- skip sub-questions
- skip sections
- skip options
- skip instructions
- change marks
- merge questions
- silently discard unclear content

Preserve:
- original numbering
- all question text
- all sub-question text
- all options
- all printed marks
- section names
- instructions
- tables/matching questions
- case-study structure

If a question continues onto another page, preserve it as one
logical question.

If a tiny part is genuinely unreadable, use [unclear] only there.

IMPORTANT:
This is OCR.

The marks printed on the source paper are authoritative.
DO NOT alter marks to make them equal ${meta.totalMarks}.

Calculate the actual transcribed total separately.

SOURCE PAGE COUNT: ${sourcePageCount}

Metadata:
School: ${meta.schoolName}
Class: ${meta.classGrade}
Subject: ${meta.subject}
Exam: ${meta.examType}
Duration: ${meta.durationMinutes} minutes

Respond ONLY with valid JSON.

JSON:
{
  "school_name": "${meta.schoolName}",
  "title": "${meta.examType}",
  "subject": "${meta.subject}",
  "class_grade": "${meta.classGrade}",
  "total_marks": ${meta.totalMarks},
  "duration_minutes": ${meta.durationMinutes},
  "academic_session": "${meta.academicSession}",
  "set_code": "${meta.setCode}",
  "source_page_count": ${sourcePageCount},
  "transcribed_question_count": 0,
  "transcribed_total_marks": 0,
  "has_student_blanks": ${meta.includeStudentBlanks},
  "instructions": [],
  "sections": [
    {
      "section_name": "SECTION A",
      "questions": [
        {
          "question_number": 1,
          "question_text": "Complete source question",
          "options": [],
          "marks": 1,
          "answer_key": "",
          "topic": "",
          "concept": "",
          "sub_questions": []
        }
      ]
    }
  ]
}
`;

  const parts = [
    {
      text: prompt
    }
  ];

  images.forEach(
    (b64, index) => {
      parts.push({
        text:
          `SOURCE PAGE ${index + 1} OF ${sourcePageCount}`
      });

      parts.push({
        inlineData: {
          mimeType:
            "image/jpeg",

          data:
            String(b64).replace(
              /^data:image\/\w+;base64,/,
              ""
            )
        }
      });
    }
  );

  const errors = [];

  for (const key of keys) {
    for (const model of MODELS) {
      try {
        const url =
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

        const response =
          await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts
                }
              ],

              generationConfig: {
                responseMimeType:
                  "application/json",

                temperature: 0.05
              }
            })
          });

        const data =
          await response.json();

        const text =
          data?.candidates?.[0]
            ?.content?.parts?.[0]
            ?.text;

        if (response.ok && text) {
          try {
            const exam =
              JSON.parse(
                stripJsonFences(text)
              );

            const normalized =
              normalizeExam(
                exam,
                meta
              );

            normalized.source_page_count =
              sourcePageCount;

            const stats =
              calculateMarks(
                normalized
              );

            normalized.transcribed_question_count =
              stats.count;

            normalized.transcribed_total_marks =
              stats.total;

            return normalized;
          } catch {
            errors.push(
              `Gemini [${model}]: invalid JSON`
            );
          }
        } else {
          errors.push(
            `Gemini [${model}]: ${
              data?.error?.message ||
              response.statusText
            }`
          );
        }
      } catch (error) {
        errors.push(
          `Gemini [${model}]: ${
            error?.message ||
            "request failed"
          }`
        );
      }
    }
  }

  throw new Error(
    `OCR transcription failed: ${
      errors.slice(0, 5).join(" | ")
    }`
  );
}

export default async function handler(
  req,
  res
) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

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
      error:
        "GEMINI_API_KEY is not configured in environment variables."
    });
  }

  const geminiKeys =
    rawGeminiKeys
      .split(",")
      .map(k => k.trim())
      .filter(Boolean);

  try {
    const body =
      req.body ||
      {};

    const meta = {
      inputType:
        cleanText(
          body.inputType,
          "ncert"
        ).toLowerCase(),

      rawText:
        cleanText(
          body.rawText
        ),

      chapterName:
        cleanText(
          body.chapterName
        ),

      schoolName:
        cleanText(
          body.schoolName,
          "Invincible Coaching Classes"
        ),

      subject:
        cleanText(
          body.subject,
          "General"
        ),

      classGrade:
        cleanText(
          body.classGrade,
          "Class 10"
        ),

      totalMarks:
        Math.max(
          1,
          Math.round(
            numberOr(
              body.totalMarks,
              80
            )
          )
        ),

      examType:
        cleanText(
          body.examType,
          "Summative Assessment"
        ),

      durationMinutes:
        Math.max(
          1,
          Math.round(
            numberOr(
              body.durationMinutes,
              180
            )
          )
        ),

      academicSession:
        cleanText(
          body.academicSession,
          "2026-27"
        ),

      setCode:
        cleanText(
          body.setCode,
          "A"
        ),

      includeStudentBlanks:
        body.includeStudentBlanks !== false,

      includeMCQs:
        body.includeMCQs === true,

      includeAssertionReason:
        body.includeAssertionReason === true,

      includeCaseStudy:
        body.includeCaseStudy === true
    };

    const images =
      Array.isArray(
        body.imageBase64Array
      )
        ? body.imageBase64Array.filter(Boolean)
        : [];

    /*
      CAMERA / PHOTOS
      ===============
      Exact OCR.
      Never force the requested total.
    */
    if (
      meta.inputType ===
      "camera"
    ) {
      if (!images.length) {
        return res.status(400).json({
          success: false,
          error:
            "Camera/OCR mode requires at least one page image."
        });
      }

      const exam =
        await runOCR(
          geminiKeys,
          meta,
          images
        );

      return res.status(200).json({
        success: true,
        mode: "ocr",
        exam
      });
    }

    /*
      SYLLABUS / TEXT
      ===============
      New generated examination
      with exact mark validation.
    */
    if (
      !meta.chapterName &&
      !meta.rawText
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Please provide chapters/syllabus or paste text/notes before generating the paper."
      });
    }

    const exam =
      await runGeneration(
        geminiKeys,
        meta
      );

    return res.status(200).json({
      success: true,
      mode: "generate",
      exam
    });

  } catch (error) {
    console.error(
      "Faculty Studio Paper Error:",
      error
    );

    const isValidationError =
      error?.code ===
        "MARK_TOTAL_MISMATCH" ||
      error?.code ===
        "MARK_DISTRIBUTION_MISMATCH";

    return res.status(
      isValidationError
        ? 422
        : 500
    ).json({
      success: false,

      error:
        error?.message ||
        "Server error processing examination paper.",

      code:
        error?.code ||
        "PAPER_GENERATION_ERROR"
    });
  }
}