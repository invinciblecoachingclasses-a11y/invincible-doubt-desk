export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { subject, question, image, tone, history } = req.body || {};

    if (!question && !image && (!history || history.length === 0)) {
      return res.status(400).json({ error: "Please enter a question or upload a photo." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured." });
    }

    const systemPrompt = `You are a master teacher for CBSE/State board students at Invincible Coaching Classes.
Subject: ${subject || "General"}

INSTRUCTIONS:
1. Explain clearly in friendly conversational Hinglish.
2. For all equations and math expressions, use standard LaTeX ($ for inline, $$ for block formulas).
3. Always structure the response cleanly:
   - 🎯 **Direct Formula / Core Concept**
   - 🧠 **Step-by-Step Solution**
   - 💡 **Final Answer / Key Takeaway**
   - 🚨 **Common Student Mistakes (सावधानियां)**: Highlight 1-2 frequent mistakes students make in this concept.`;

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
        inline_data: {
          mime_type: image.mimeType || "image/jpeg",
          data: image.data.replace(/^data:image\/\w+;base64,/, "")
        }
      });
    }

    // Models ordered by priority with automatic fallbacks
    const models = ["gemini-3.6-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash"];
    let answer = null;
    let lastError = null;

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
          break; // Success! Exit loop
        } else {
          lastError = data?.error?.message || "Quota reached";
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!answer) {
      return res.status(429).json({
        error: "Desk is receiving high student traffic right now. Please wait 15 seconds and tap View Solution again!"
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
