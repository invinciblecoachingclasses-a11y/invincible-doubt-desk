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
        error:
          "Supabase environment variables are not configured."
      });
    }

    // ==========================================================
    // RECEIVE TEST RESULT
    // ==========================================================

    const body = req.body || {};

    const {
      studentName,
      studentMobile,
      studentClass,
      subject,
      chapter,
      testTitle,
      testType,
      totalQuestions,
      attempted,
      correct,
      wrong,
      unanswered,
      percentage,
      answers
    } = body;

    // ==========================================================
    // BASIC VALIDATION
    // ==========================================================

    if (!studentName) {
      return res.status(400).json({
        success: false,
        error: "Student name is required."
      });
    }

    if (!studentMobile) {
      return res.status(400).json({
        success: false,
        error: "Student mobile number is required."
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        error: "Subject is required."
      });
    }

    if (!testTitle) {
      return res.status(400).json({
        success: false,
        error: "Test title is required."
      });
    }

    // ==========================================================
    // SUPABASE REST API
    // ==========================================================

    const endpoint =
      `${supabaseUrl}/rest/v1/test_attempts`;

    // ==========================================================
    // DATA
    // ==========================================================

    const record = {

      student_name:
        studentName,

      student_mobile:
        studentMobile,

      class:
        studentClass || null,

      subject:
        subject,

      chapter:
        chapter || null,

      test_title:
        testTitle,

      test_type:
        testType || "Manual",

      total_questions:
        Number(totalQuestions) || 0,

      attempted:
        Number(attempted) || 0,

      correct:
        Number(correct) || 0,

      wrong:
        Number(wrong) || 0,

      unanswered:
        Number(unanswered) || 0,

      percentage:
        Number(percentage) || 0,

      answers:
        answers || [],

      submitted_at:
        new Date().toISOString()
    };

    // ==========================================================
    // INSERT
    // ==========================================================

    const response =
      await fetch(endpoint, {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

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
        "Supabase test attempt error:",
        data
      );

      return res.status(500).json({

        success: false,

        error:
          data?.message ||
          data?.details ||
          data?.hint ||
          "Unable to save test attempt.",

        supabase:
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