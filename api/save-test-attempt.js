export default async function handler(req, res) {
  // ============================================================
  // CORS HEADERS
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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: "Supabase environment variables are not configured."
      });
    }

    const body = req.body || {};

    // Extract student and academic credentials
    const studentName = body.studentName || body.name || "Anonymous Student";
    const studentMobile = body.studentMobile || body.mobile || "N/A";
    
    // STRICT MULTI-TENANT LOCK: Prefer explicit school_id if passed by the frontend
    const organization = body.school_id || body.organization || body.school_name || body.school || body.institution || "Invincible Coaching";
    
    const studentClass = body.studentClass || body.class || body.className || "10";
    const percentage = Math.min(Math.max(Number(body.percentage || 0), 0), 100);
    
    // Explicitly capture exam type (UT-1, Pre-Board, etc.) for Marksheet Aggregation
    const examType = body.examType || body.testType || "Algorithmic Generation";

    const record = {
      student_name: studentName,
      student_mobile: studentMobile,
      organization: organization, // Tenant Lock
      school_name: organization,  // Tenant Backup
      student_class: String(studentClass),
      subject: body.subject || "General",
      chapter: body.chapter || "Full Syllabus",
      test_title: body.testTitle || "Practice Assessment",
      test_type: examType, 
      total_questions: Number(body.totalQuestions || 0),
      attempted: Number(body.attempted || 0),
      correct: Number(body.correct || 0),
      wrong: Number(body.wrong || 0),
      unanswered: Number(body.unanswered || 0),
      percentage: percentage,
      answers: typeof body.answers === "string" ? body.answers : JSON.stringify(body.answers || []),
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
      message: "Test attempt recorded successfully.",
      attempt: Array.isArray(data) ? data[0] : data
    });

  } catch (error) {
    console.error("SAVE TEST ATTEMPT SERVER ERROR:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Unexpected server error."
    });
  }
}
