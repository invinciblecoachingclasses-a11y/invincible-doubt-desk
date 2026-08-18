export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY; // Your existing Gemini Key
    
    const { action, room_code, player_name, subject, class_name, player_num, total_score, is_finished } = req.body;

    const headers = { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`, 
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    try {
        // ==========================================
        // ACTION 1: CREATE ROOM & GENERATE AI QUESTIONS
        // ==========================================
        if (action === 'create') {
            const code = Math.floor(1000 + Math.random() * 9000).toString(); 
            
            // Ask Gemini for 5 fresh, mind-bending questions
            const prompt = `Generate exactly 5 highly engaging, fun, and technical "hook" multiple-choice questions for Class ${class_name} ${subject} students. The questions should be tricky or mind-bending but easy to answer if they think logically. 
            Return strictly a JSON array of objects. Do not include markdown blocks like \`\`\`json.
            Format exactly like this:
            [{"question": "Question text here?", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": 0, "explanation": "Short teacher logic here."}]`;

            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            const geminiData = await geminiRes.json();
            let rawText = geminiData.candidates[0].content.parts[0].text;
            
            // Clean up any accidental markdown formatting from Gemini
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiQuestions = JSON.parse(rawText);

            // Save the newly generated AI questions into the Supabase Arena Lobby
            await fetch(`${supabaseUrl}/rest/v1/arena_battles`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    room_code: code,
                    subject: subject,
                    player1_name: player_name,
                    questions: JSON.stringify(aiQuestions), // Storing the AI questions
                    status: 'waiting'
                })
            });
            return res.status(200).json({ room_code: code, questions: aiQuestions });
        }

        // ==========================================
        // ACTION 2: JOIN ROOM
        // ==========================================
        if (action === 'join') {
            const rRes = await fetch(`${supabaseUrl}/rest/v1/arena_battles?room_code=eq.${room_code}&select=*`, { headers });
            const rooms = await rRes.json();
            
            if (!rooms || rooms.length === 0) return res.status(404).json({ error: 'Invalid Room Code.' });
            const room = rooms[0];
            if (room.status !== 'waiting') return res.status(400).json({ error: 'Room is already full or finished.' });

            const updateRes = await fetch(`${supabaseUrl}/rest/v1/arena_battles?room_code=eq.${room_code}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ player2_name: player_name, status: 'playing' })
            });
            const updatedData = await updateRes.json();
            
            return res.status(200).json({ room: updatedData[0], questions: JSON.parse(room.questions) });
        }

        // ==========================================
        // ACTION 3: SYNC / UPDATE SCORES LIVE
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
        console.error(error);
        return res.status(500).json({ error: 'Failed to generate AI questions or connect to Arena.' });
    }
}
