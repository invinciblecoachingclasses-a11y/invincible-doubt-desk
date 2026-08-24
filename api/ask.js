export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { subject, question, image, tone, history } = req.body || {};

    if (!question && !image && (!history || history.length === 0)) {
      return res.status(400).json({ error: "Please enter a question or upload a photo." });
    }

    const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
    if (!rawKeys) {
      return res.status(500).json({ error: "Gemini API key is not configured in Vercel." });
    }

    const keys = rawKeys.split(",").map(k => k.trim()).filter(Boolean);

    const systemPrompt = `You are a master teacher for CBSE/State board students at Invincible Coaching Classes.
Subject: ${subject || "General"}

INSTRUCTIONS:
1. Explain clearly in friendly conversational Hinglish.
2. For all equations and math expressions, use standard LaTeX ($ for inline, $$ for block formulas).
3. Structure your answer cleanly:
   - 🎯 **Direct Formula / Core Concept**
   - 🧠 **Step-by-Step Solution**
   - 💡 **Final Answer / Key Takeaway**
   - 🚨 **Common Student Mistakes (सावधानियां)**`;

    let parts = [{ text: systemPrompt }];

    if (Array.isArray(history) && history.length > 0) {
      history.forEach(item => {
        parts.push({ text: `${item.role === 'user' ? 'Student' : 'Teacher'}: ${item.content}` });
      });
    }

    if (question) {
      parts.push({ text: `Current Student Question:\n${question}` });
    }

    if (image && image.data) {
  parts.push({
    inlineData: {
      mimeType: image.mimeType || "image/jpeg",
      data: image.data.replace(/^data:image\/\w+;base64,/, "")
    }
  });
}


    // Exact model IDs requested by your API endpoint
    const models = ["gemini-3.6-flash", "gemini-3.5-flash-lite"];
    let answer = null;
    let errorLog = [];

    keyLoop: for (const apiKey of keys) {
      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: [{ parts }] })
            }
          );

          const data = await response.json();
          if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            answer = data.candidates[0].content.parts[0].text;
            break keyLoop;
          } else {
            errorLog.push(`${model}: ${data?.error?.message || response.statusText}`);
          }
        } catch (err) {
          errorLog.push(`${model}: ${err.message}`);
        }
      }
    }

    if (!answer) {
      return res.status(500).json({
        error: `Model Failure: ${errorLog.slice(0, 2).join(" | ")}`
      });
    }

    return res.status(200).json({
      success: true,
      subject: subject || "General",
      answer: answer
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message || "Server error. Please try again." });
  }
}
