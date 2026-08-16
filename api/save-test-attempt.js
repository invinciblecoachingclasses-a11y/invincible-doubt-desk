export default async function handler(req, res) {
  // CORS
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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: "Supabase environment variables are not configured."
      });
    }

    const body = req.body || {};

    // Validate minimum required fields from the form
    const studentName = body.studentName || body.name || "Anonymous Student";
    const studentMobile = body.studentMobile || body.mobile || "N/A";

    const record = {
      student_name: studentName,
      student_mobile: studentMobile,
      student_class: body.studentClass || body.class || null,
      subject: body.subject || null,
      chapter: body.chapter || null,
      test_title: body.testTitle || "Practice Test",
      test_type: body.testType || "Manual",
      total_questions: Number(body.totalQuestions || 0),
      attempted: Number(body.attempted || 0),
      correct: Number(body.correct || 0),
      wrong: Number(body.wrong || 0),
      unanswered: Number(body.unanswered || 0),
      percentage: Number(body.percentage || 0),
      answers: body.answers || [],
      created_at: new Date().toISOString()
    };

    const endpoint = `${supabaseUrl}/rest/v1/test_attempts`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(record)
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }

    if (!response.ok) {
      console.error("SUPABASE SAVE ERROR:", data);
      return res.status(response.status).json({
        success: false,
        error: data?.message || data?.details || "Unable to save test attempt.",
        supabaseError: data
      });
    }

    return res.status(200).json({
      success: true,
      message: "Test attempt saved successfully.",
      attempt: Array.isArray(data) ? data[0] : data
    });

  } catch (error) {
    console.error("SAVE TEST ATTEMPT ERROR:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Unexpected server error."
    });
  }
}
