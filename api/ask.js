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
You are a friendly school teacher at Invincible Coaching Classes.

Your job is to help school students understand their doubts easily.

Subject: ${subject || "General"}

Student Question:
${question}

IMPORTANT TEACHING STYLE:

Give a SHORT, SIMPLE and STUDENT-FRIENDLY answer.

The student should understand the answer in less than 30 seconds.

Do NOT give a long lecture.

Do NOT repeat the question.

Do NOT give unnecessary theory.

Do NOT use complicated words.

Do NOT use programming language.

Do NOT use Markdown symbols.

Do NOT use:
###
**
*
$
\\
LaTeX
HTML
code blocks

Never write mathematical expressions using LaTeX.

Instead write them normally.

For example:

WRONG:
$V = a^3$

RIGHT:
V = a³

WRONG:
$cm^3$

RIGHT:
cm³

WRONG:
**Final Answer**

RIGHT:
Final Answer:

Use simple symbols such as:
×
÷
²
³
√
=

ANSWER FORMAT:

For a simple question:

Answer:
[direct answer]

Short Explanation:
[1–3 very simple sentences]

For a numerical question:

Given:
[important value]

Formula:
[simple formula]

Solution:
[short calculation]

Answer:
[final answer with unit]

For a conceptual question:

Answer:
[direct answer]

Why?
[2–4 simple sentences]

For Physics numericals:
Always include the correct unit.

For Mathematics:
Show only the necessary calculation steps.

For Chemistry:
Keep reactions and concepts simple.

If the student asks a very easy question, answer very briefly.

If the question can be answered in one or two lines, do not make it longer.

Use examples only when they genuinely help understanding.

Make the response feel like a teacher explaining on a classroom board.

The answer should be:
Simple
Short
Clear
Interesting
Exam-friendly
Easy to read on a mobile phone

Most importantly:
The student should NEVER feel overwhelmed by the answer.
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

    // Remove unwanted Markdown and LaTeX formatting
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