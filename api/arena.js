export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY; 
    
    const { action, room_code, player_name, class_name, player_num, total_score, is_finished } = req.body;

    const headers = { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`, 
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    try {
        // ==========================================
        // ACTION 1: CREATE ROOM (10 PUNCHY AI QUESTIONS)
        // ==========================================
        if (action === 'create') {
            const code = Math.floor(1000 + Math.random() * 9000).toString(); 

            const prompt = `Generate exactly 10 rapid-fire, super fun, punchy, and tricky mental multiple-choice questions for Class ${class_name} students combining General Science and Quick Mental Maths.
            Requirements:
            - Mix of 5 fun/technical Science questions and 5 speedy Mental Math/logic teasers.
            - Questions and options must be short and direct so students can read and answer within 5 to 10 seconds.
            - Ensure questions are 100% unique, fresh, and engaging.
            Format output strictly as a JSON array of 10 objects:
            [
              {
                "question": "Short punchy question?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": 0,
                "explanation": "Short 1-line teacher logic."
              }
            ]`;

            let finalQuestions = [];

            try {
                const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            responseMimeType: "application/json",
                            temperature: 0.9 // Higher randomness for brand new questions each time
                        }
                    })
                });

                const geminiData = await geminiRes.json();
                const rawText = geminiData.candidates[0].content.parts[0].text;
                finalQuestions = JSON.parse(rawText);

                if (!Array.isArray(finalQuestions) || finalQuestions.length < 5) throw new Error("Invalid format");

            } catch (aiErr) {
                console.error("AI Generation fallback triggered:", aiErr);
                // Fallback to database questions if Gemini limits are hit
                const qRes = await fetch(`${supabaseUrl}/rest/v1/weekly_tests?class_name=eq.${class_name}&select=*`, { headers });
                const allQuestions = await qRes.json();
                finalQuestions = (allQuestions || []).sort(() => 0.5 - Math.random()).slice(0, 10);
            }

            // Save room into Supabase
            const dbRes = await fetch(`${supabaseUrl}/rest/v1/arena_battles`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    room_code: code,
                    subject: 'Science & Maths',
                    player1_name: player_name,
                    questions: JSON.stringify(finalQuestions),
                    status: 'waiting'
                })
            });

            if (!dbRes.ok) throw new Error("Failed to write to database table.");

            return res.status(200).json({ room_code: code, questions: finalQuestions });
        }

        // ==========================================
        // ACTION 2: JOIN ROOM
        // ==========================================
        if (action === 'join') {
            const rRes = await fetch(`${supabaseUrl}/rest/v1/arena_battles?room_code=eq.${room_code}&select=*`, { headers });
            const rooms = await rRes.json();
            
            if (!rooms || rooms.length === 0) return res.status(404).json({ error: 'Room code not found.' });
            const room = rooms[0];
            if (room.status !== 'waiting') return res.status(400).json({ error: 'This match is already in progress or ended.' });

            const updateRes = await fetch(`${supabaseUrl}/rest/v1/arena_battles?room_code=eq.${room_code}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ player2_name: player_name, status: 'playing' })
            });
            const updatedData = await updateRes.json();
            
            return res.status(200).json({ room: updatedData[0], questions: JSON.parse(room.questions) });
        }

        // ==========================================
        // ACTION 3: SYNC SCORE LIVE
        // ==========================================
        if (action === 'sync') {
            if (total_score !== undefined) {
                const updateBody = {};
                updateBody[`player${player_num}_score`] = total_score;
                if (is_finished) updateBody[`player${player_num}_finished`] = true;

                await fetch(`${supabaseUrl}/rest/v1/arena_battles?room_code=eq.${room_code}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(updateBody)
                });
            }

            const syncRes = await fetch(`${supabaseUrl}/rest/v1/arena_battles?room_code=eq.${room_code}&select=*`, { headers });
            const syncData = await syncRes.json();
            return res.status(200).json({ room: syncData[0] });
        }

    } catch (error) {
        console.error("Arena Handler Error:", error);
        return res.status(500).json({ error: error.message || 'Server error. Please try again.' });
    }
}
