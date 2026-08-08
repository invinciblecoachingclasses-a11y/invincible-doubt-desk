export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { subject, question } = req.body || {};

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is missing."
      });
    }

    const prompt = `
You are the AI teacher for Invincible Coaching Classes.

You teach school students Mathematics, Physics and Chemistry.

Subject:
${subject || "General"}

Student Question:
${question}

IMPORTANT:

Start every solution EXACTLY with:

Aao logic samjhate hain

Do not write:
Answer:
Let's solve it.
Let's understand it.
AI Teacher Solution
Here is the solution.

TEACHING STYLE:

- Explain like a friendly school teacher.
- Use simple Hinglish where helpful.
- Keep the answer SHORT.
- Keep the explanation easy and interesting.
- Assume the student may not know the concept.
- Avoid long lectures.
- Avoid unnecessary theory.
- Do not repeat the student's question.
- Explain the logic before or along with the calculation.
- The student should understand the answer quickly.

FORMATTING:

Do NOT use Markdown symbols.

Do NOT use:
###
**
*
$
LaTeX
HTML
code blocks

Never write mathematical expressions using LaTeX.

Use normal school-style mathematics.

WRONG:
$V = a^3$

RIGHT:
V = a³

WRONG:
$cm^3$

RIGHT:
cm³

Use:
×
÷
²
³
√
=

SIMPLE QUESTION FORMAT:

Aao logic samjhate hain

[Very short and simple explanation]

[Calculation if needed]

Final Answer:
[answer]

NUMERICAL QUESTION FORMAT:

Aao logic samjhate hain

Given:
[important value]

Formula:
[simple formula]

Calculation:
[short calculation]

Final Answer:
[answer with unit]

CONCEPTUAL QUESTION FORMAT:

Aao logic samjhate hain

[Simple explanation in 2–4 short sentences]

Key Point:
[one important thing to remember]

SUBJECT RULES:

For Mathematics:
- Show only necessary steps.
- Explain the mathematical logic simply.
- Do not make easy questions unnecessarily lengthy.

For Physics:
- Give formula.
- Substitute values clearly.
- Show calculation.
- Always write the correct unit.

For Chemistry:
- Explain the concept simply.
- Show chemical equations only when required.
- Keep reactions and calculations easy to understand.

FOR VERY EASY QUESTIONS:

Keep the answer extremely short.

Do not add unnecessary:
- Common mistakes
- Extra examples
- Long theory
- Additional tips

Only include these when genuinely useful.

The final response must feel like a teacher explaining on a classroom board.

The student should NEVER feel overwhelmed.

Keep answers concise, clear, friendly and exam-friendly.
`;

    const model = "gemini-3.5-flash-lite";

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      model +
      ":generateContent?key=" +
      encodeURIComponent(apiKey);

    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],

        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 900
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    let answer =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!answer) {
      return res.status(500).json({
        error: "Gemini returned no answer."
      });
    }

    // Clean unwanted formatting
    answer = answer
      .replace(/\*\*/g, "")
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/#/g, "")
      .replace(/\$/g, "")
      .replace(/\\text\{([^}]*)\}/g, "$1")
      .replace(/\\mathrm\{([^}]*)\}/g, "$1")
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\cdot/g, "×")
      .replace(/\\sqrt\{([^}]*)\}/g, "√($1)")
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2")
      .replace(/\\left/g, "")
      .replace(/\\right/g, "")
      .trim();

    // Make sure the desired opening is present
    if (!answer.startsWith("Aao logic samjhate hain")) {
      answer = "Aao logic samjhate hain\n\n" + answer;
    }

    return res.status(200).json({
      success: true,
      subject: subject || "General",
      answer: answer
    });

  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      error: "Something went wrong while solving the doubt."
    });
  }
}