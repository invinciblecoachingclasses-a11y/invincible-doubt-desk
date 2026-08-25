// api/cron-daily-blitz.js
export const maxDuration = 60; // Max execution time for batch generation

export default async function handler(req, res) {
  // 1. Verify Vercel Cron Secret (Prevents unauthorized manual triggers)
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized cron execution.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rawGeminiKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !supabaseKey || !rawGeminiKeys) {
    return res.status(500).json({ error: 'Missing environment credentials.' });
  }

  const geminiKeys = rawGeminiKeys.split(',').map(k => k.trim()).filter(Boolean);
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  const today = new Date().toISOString().split('T')[0];

  try {
    // ============================================================
    // STEP A: GENERATE TODAY'S 15-SECOND DAILY CLASH PUZZLE
    // ============================================================
    const puzzlePrompt = `
Generate 1 tricky, high-yield Indian CBSE Board concept trap question for today's Daily Clash.
Suitable for Class 9-12 Science/Maths.
Must have a subtle common student misconception (Examiner Trap).

Respond ONLY with valid, raw JSON (no markdown ticks):
{
  "question": "English question text",
  "question_hi": "Hindi question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_option": 1,
  "explanation": "Short 1-sentence mathematical/conceptual breakdown.",
  "xp_reward": 50
}
`;

    let dailyPuzzleData = null;

    keyLoop: for (const key of geminiKeys) {
      for (const model of MODELS) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: puzzlePrompt }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.4 }
            })
          });

          const data = await response.json();
          if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const cleanText = data.candidates[0].content.parts[0].text
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/i, '')
              .replace(/\s*```$/i, '')
              .trim();
            dailyPuzzleData = JSON.parse(cleanText);
            break keyLoop;
          }
        } catch (e) {}
      }
    }

    if (dailyPuzzleData) {
      // Upsert today's puzzle in Supabase
      await fetch(`${supabaseUrl}/rest/v1/daily_puzzle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          puzzle_date: today,
          question: dailyPuzzleData.question,
          question_hi: dailyPuzzleData.question_hi || '',
          options: dailyPuzzleData.options,
          correct_option: Number(dailyPuzzleData.correct_option) || 0,
          explanation: dailyPuzzleData.explanation || 'Review core CBSE formulas.',
          xp_reward: 50
        })
      });
    }

    // ============================================================
    // STEP B: REFILL STUDY REELS FOR CLASSES 9, 10, 11, 12
    // ============================================================
    const grades = ['9', '10', '11', '12'];
    const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    const randomGrade = grades[Math.floor(Math.random() * grades.length)];
    const randomSub = subjects[Math.floor(Math.random() * subjects.length)];

    const reelsPrompt = `
Generate 4 fresh, punchy Study Reels cards for CBSE Class ${randomGrade} (${randomSub}).
Create a mix of: 2 MCQ cards, 1 Examiner Trap card, and 1 Formula Vault card.

Respond ONLY with valid, raw JSON array (no markdown ticks):
[
  {
    "class_name": "${randomGrade}",
    "type": "mcq",
    "subject": "${randomSub}",
    "topic": "Key Chapter Concept",
    "q_en": "Question text in English",
    "q_hi": "Question text in Hindi",
    "options": ["Opt 1", "Opt 2", "Opt 3", "Opt 4"],
    "answer": 0,
    "trap": "Why students get tricked here"
  },
  {
    "class_name": "${randomGrade}",
    "type": "trap",
    "subject": "${randomSub}",
    "topic": "Core Board Rule",
    "title": "Examiner Trap Title",
    "content": "Description of the fatal calculation error",
    "rule": "Exact CBSE board marking rule"
  },
  {
    "class_name": "${randomGrade}",
    "type": "formula",
    "subject": "${randomSub}",
    "topic": "Formula Mastery",
    "title": "Core Formula Title",
    "formula": "LaTeX formula string without dollar signs",
    "tip": "Application tip"
  }
]
`;

    let generatedReels = null;

    keyLoop2: for (const key of geminiKeys) {
      for (const model of MODELS) {
        try {
          const url = `[https://generativelanguage.googleapis.com/v1beta/models/$](https://generativelanguage.googleapis.com/v1beta/models/$){model}:generateContent?key=${encodeURIComponent(key)}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: reelsPrompt }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
            })
          });

          const data = await response.json();
          if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const cleanText = data.candidates[0].content.parts[0].text
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/i, '')
              .replace(/\s*```$/i, '')
              .trim();
            generatedReels = JSON.parse(cleanText);
            break keyLoop2;
          }
        } catch (e) {}
      }
    }

    if (Array.isArray(generatedReels) && generatedReels.length > 0) {
      for (const reel of generatedReels) {
        await fetch(`${supabaseUrl}/rest/v1/study_reels`, {
          method: 'POST',
          headers,
          body: JSON.stringify(reel)
        }).catch(() => {});
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      dailyPuzzleUpdated: Boolean(dailyPuzzleData),
      reelsAdded: Array.isArray(generatedReels) ? generatedReels.length : 0
    });

  } catch (error) {
    console.error('Cron Blitz Execution Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
