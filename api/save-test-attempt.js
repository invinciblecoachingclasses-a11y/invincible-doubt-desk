// api/save-test-attempt.js

export default async function handler(req, res) {

  // ============================================================
  // CORS
  // ============================================================

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Only POST requests are allowed."
    });
  }

  try {

    // ==========================================================
    // SUPABASE SETTINGS
    // ==========================================================

    const supabaseUrl =
      process.env.SUPABASE_URL;

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: "Supabase environment variables are not configured."
      });
    }

    // ==========================================================
    // RECEIVE DATA
    // ==========================================================

    const body = req.body || {};

    const testId =
      body.testId ||
      body.test_id ||
      null;

    const studentId =
      body.studentId ||
      body.student_id ||
      null;

    const score =
      Number(
        body.score ??
        body.percentage ??
        0
      );

    const totalMarks =
      Number(
        body.totalMarks ??
        body.total_marks ??
        body.totalQuestions ??
        0
      );

    const correctAnswers =
      Number(
        body.correctAnswers ??
        body.correct_answers ??
        body.correct ??
        0
      );

    const startedAt =
      body.startedAt ||
      body.started_at ||
      null;

    const completedAt =
      body.completedAt ||
      body.completed_at ||
      new Date().toISOString();

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!testId) {
      return res.status(400).json({
        success: false,
        error: "Test ID is missing."
      });
    }

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: "Student ID is missing."
      });
    }

    // ==========================================================
    // PREPARE RECORD
    // ==========================================================

    const record = {
      test_id: testId,
      student_id: studentId,
      score: score,
      total_marks: totalMarks,
      correct_answers: correctAnswers,
      completed_at: completedAt
    };

    // Add started_at only when available.
    if (startedAt) {
      record.started_at = startedAt;
    }

    // ==========================================================
    // SUPABASE REST API
    // ==========================================================

    const endpoint =
      `${supabaseUrl}/rest/v1/test_attempts`;

    // ==========================================================
    // INSERT
    // ==========================================================

    const response =
      await fetch(endpoint, {

        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "apikey":
            supabaseKey,

          "Authorization":
            `Bearer ${supabaseKey}`,

          "Prefer":
            "return=representation"
        },

        body:
          JSON.stringify(record)
      });

    // ==========================================================
    // READ RESPONSE
    // ==========================================================

    const responseText =
      await response.text();

    let data;

    try {
      data =
        JSON.parse(responseText);
    } catch {
      data =
        responseText;
    }

    // ==========================================================
    // SUPABASE ERROR
    // ==========================================================

    if (!response.ok) {

      console.error(
        "SUPABASE SAVE ERROR:",
        data
      );

      return res.status(response.status).json({

        success: false,

        error:
          data?.message ||
          data?.details ||
          data?.hint ||
          "Unable to save test attempt.",

        supabaseError:
          data
      });
    }

    // ==========================================================
    // SUCCESS
    // ==========================================================

    return res.status(200).json({

      success: true,

      message:
        "Test attempt saved successfully.",

      attempt:
        Array.isArray(data)
          ? data[0]
          : data

    });

  } catch (error) {

    // ==========================================================
    // UNEXPECTED ERROR
    // ==========================================================

    console.error(
      "SAVE TEST ATTEMPT ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        error?.message ||
        "Unexpected server error."

    });
  }
}