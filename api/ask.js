export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { subject, question, image, tone, history } = req.body || {};

    if (!question && !image && (!history || history.length === 0)) {
      return res.status(400).json({ error: "Please enter a question or upload a photo." });
    }

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

    // 1. Prepare Gemini Payload Format
    let geminiParts = [{ text: systemPrompt }];

    if (Array.isArray(history) && history.length > 0) {
      history.forEach(item => {
        geminiParts.push({ text: `${item.role === 'user' ? 'Student' : 'Teacher'}: ${item.content}` });
      });
    }

    if (question) {
      geminiParts.push({ text: `Current Student Question:\n${question}` });
    }

    if (image && image.data) {
      geminiParts.push({
        inlineData: {
          mimeType: image.mimeType || "image/jpeg",
          data: image.data.replace(/^data:image\/\w+;base64,/, "")
        }
      });
    }

    let answer = null;
    let errorLog = [];

    // ==========================================
    // PHASE 1: Primary Provider (Google Gemini)
    // ==========================================
    const rawGeminiKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
    if (rawGeminiKeys) {
      const geminiKeys = rawGeminiKeys.split(",").map(k => k.trim()).filter(Boolean);
      const geminiModels = ["gemini-3.6-flash", "gemini-3.5-flash-lite"];


      keyLoop: for (const apiKey of geminiKeys) {
        for (const model of geminiModels) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: geminiParts }] })
              }
            );

            const data = await response.json();
            if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
              answer = data.candidates[0].content.parts[0].text;
              break keyLoop;
            } else {
              errorLog.push(`Gemini [${model}]: ${data?.error?.message || response.statusText}`);
            }
          } catch (err) {
            errorLog.push(`Gemini [${model}]: ${err.message}`);
          }
        }
      }
    }

    // ==========================================
    // PHASE 2: Fallback Provider (Anthropic Claude)
    // ==========================================
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!answer && anthropicKey) {
      try {
        let claudeContent = [];

        if (image && image.data) {
          claudeContent.push({
            type: "image",
            source: {
              type: "base64",
              media_type: image.mimeType || "image/jpeg",
              data: image.data.replace(/^data:image\/\w+;base64,/, "")
            }
          });
        }

        let fullPromptText = "";
        if (Array.isArray(history) && history.length > 0) {
          fullPromptText += history.map(h => `${h.role === 'user' ? 'Student' : 'Teacher'}: ${h.content}`).join("\n") + "\n\n";
        }
        if (question) {
          fullPromptText += `Current Student Question:\n${question}`;
        }
        claudeContent.push({ type: "text", text: fullPromptText });

        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 2048,
            system: systemPrompt,
            messages: [{ role: "user", content: claudeContent }]
          })
        });

        const claudeData = await claudeRes.json();
        if (claudeRes.ok && claudeData?.content?.[0]?.text) {
          answer = claudeData.content[0].text;
        } else {
          errorLog.push(`Claude: ${claudeData?.error?.message || claudeRes.statusText}`);
        }
      } catch (claudeErr) {
        errorLog.push(`Claude: ${claudeErr.message}`);
      }
    }

    // ==========================================
    // PHASE 3: Final Output Delivery
    // ==========================================
    if (!answer) {
      return res.status(500).json({
        error: `All models exhausted: ${errorLog.slice(0, 2).join(" | ")}`
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
