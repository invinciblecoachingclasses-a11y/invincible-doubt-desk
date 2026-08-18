export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { subject, question, image, tone } = req.body || {};

    if (!question && !image) {
      return res.status(400).json({
        error: "Please enter a question or upload a photo."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is not configured."
      });
    }

    // Gemini Model
    const model = "gemini-3.5-flash-lite";

    // Dynamic Tone Instructions
    let toneInstruction = "";
    if (tone === "tldr") {
      toneInstruction = `
MODE: TL;DR FORMULA & RAPID ANSWER
- Give ONLY the core formula/law in 1 line.
- Show direct numeric substitution in 1 line.
- State the final calculated answer with unit in 1 line.
- Total response MUST be under 4 lines. No background lecture.`;
    } else if (tone === "eli10") {
      toneInstruction = `
MODE: EXPLAIN LIKE I'M 10 YEARS OLD (ANALOGY MODE)
- Explain the concept using simple, relatable real-world analogies (video games, water pipes, skateboards, pizza slices).
- NO complex jargon. Use very friendly, simple Hinglish.
- Break it into small, cheerful, bite-sized points.`;
    } else {
      // Default: Step-by-Step Board Explanation
      toneInstruction = `
MODE: STRUCTURED STEP-BY-STEP BOARD LOGIC
For numerical questions use:
Given:
...
Formula:
...
Putting values:
...
Final Answer:
...

For theory questions:
Explain the concept in 3–5 short sentences.`;
    }

    const prompt = `
You are a friendly school teacher for Invincible Coaching Classes.

Subject: ${subject || "General"}

Student Question:
${question || "Solve the question shown in the image."}

Tone & Depth:
${toneInstruction}

Start every response exactly with:

Aao Logic Samjhate Hain

Teaching style:
- Explain like a friendly school teacher.
- Use simple Hinglish where helpful.
- Keep the answer short.
- Use simple words.
- Explain the basic idea first.
- Show only necessary calculations.
- Do not give long lectures.
- Do not repeat the question.
- Do not overwhelm the student.

For Mathematics:
Show only necessary calculation steps.

For Physics:
Give formula, substitution and correct unit.

For Chemistry:
Explain the concept simply and show equations only when required.

Add a short "Yaad Rakho" point only when useful.

Do NOT use:
###
**
$
LaTeX
HTML
code blocks
programming-style formatting

Do NOT write:
AI Teacher Solution
Let's solve it
Let's understand it

Make the response look like a teacher explaining on a classroom board.
`;

    const parts = [
      {
        text: prompt
      }
    ];

    // Send uploaded image to Gemini
    if (image && image.data) {
      parts.push({
        inline_data: {
          mime_type: image.mimeType || "image/jpeg",
          data: image.data
        }
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: parts
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 700
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Unable to get solution from Gemini."
      });
    }

    let answer =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!answer) {
      return res.status(500).json({
        error: "Gemini returned an empty answer."
      });
    }

    // Remove unwanted formatting
    answer = answer
      .replace(/#{1,6}\s?/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\\text\{([^}]*)\}/g, "$1")
      .replace(/\\mathrm\{([^}]*)\}/g, "$1")
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\cdot/g, "×")
      .replace(/\\sqrt\{([^}]*)\}/g, "√($1)")
      .replace(/\\left/g, "")
      .replace(/\\right/g, "")
      .replace(/\\\[/g, "")
      .replace(/\\\]/g, "")
      .replace(/\$\$/g, "")
      .replace(/\$/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .trim();

    if (!answer.startsWith("Aao Logic Samjhate Hain")) {
      answer =
        "Aao Logic Samjhate Hain\n\n" +
        answer;
    }

    return res.status(200).json({
      success: true,
      subject: subject || "General",
      answer: answer
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
}
