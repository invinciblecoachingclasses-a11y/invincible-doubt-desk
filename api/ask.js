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

    // If conversation history exists, append it
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
      console.error("Gemini Error:", data);
      return res.status(response.status).json({ error: data?.error?.message || "AI service error." });
    }

    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!answer) {
      return res.status(500).json({ error: "Empty solution generated." });
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
