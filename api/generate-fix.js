// api/generate-fix.js
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { subject, topic, coreMisconception } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Missing Gemini API Key in server environment.' });
    }

    const prompt = `
      You are an expert, highly encouraging ${subject || 'Science'} tutor.
      A student has made a mistake in the topic: "${topic || 'General Concept'}".
      Their core misconception is: "${coreMisconception || 'Misunderstanding of the core rules'}".
      
      Generate a quick "2-Minute Fix" micro-lesson to correct this exact misconception.
      
      You MUST respond ONLY with a raw JSON object. Do not include markdown formatting, backticks, or any conversational text. 
      The JSON must perfectly match this exact structure:
      {
        "explanation": "A 2-sentence simple explanation correcting the misconception.",
        "example": "A 1-sentence practical, numerical, or real-world example.",
        "question": "A challenging follow-up multiple choice question to test if they fixed the misconception.",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctIndex": 1
      }
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    response_mime_type: "application/json"
                }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Gemini API Error:", data);
            return res.status(500).json({ error: "Failed to communicate with AI provider" });
        }

        const aiResponseText = data.candidates[0].content.parts[0].text;
        const fixData = JSON.parse(aiResponseText);
        
        return res.status(200).json(fixData);

    } catch (error) {
        console.error("AI Generation Failed:", error);
        return res.status(500).json({ error: "Failed to generate AI fix" });
    }
};
