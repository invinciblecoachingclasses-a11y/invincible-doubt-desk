export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { action, room_code, player_name, subject, player_num, total_score, is_finished } = req.body;

    const headers = { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`, 
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    try {
        // ACTION 1: CREATE ROOM
        if (action === 'create') {
            const code = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit code
            
            // Fetch 5 random questions for the selected subject
            const qRes = await fetch(`${supabaseUrl}/rest/v1/weekly_tests?subject=eq.${subject}&select=*`, { headers });
            const allQuestions = await qRes.json();
            const shuffled = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);

            // Save room to DB
            await fetch(`${supabaseUrl}/rest/v1/arena_battles`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    room_code: code,
                    subject: subject,
                    player1_name: player_name,
                    questions: JSON.stringify(shuffled),
                    status: 'waiting'
                })
            });
            return res.status(200).json({ room_code: code, questions: shuffled });
        }

        // ACTION 2: JOIN ROOM
        if (action === 'join') {
            const rRes = await fetch(`${supabaseUrl}/rest/v1/arena_battles?room_code=eq.${room_code}&select=*`, { headers });
            const rooms = await rRes.json();
            
            if (!rooms || rooms.length === 0) return res.status(404).json({ error: 'Invalid Room Code.' });
            const room = rooms[0];
            if (room.status !== 'waiting') return res.status(400).json({ error: 'Room is already full or finished.' });

            // Start the match
            const updateRes = await fetch(`${supabaseUrl}/rest/v1/arena_battles?room_code=eq.${room_code}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ player2_name: player_name, status: 'playing' })
            });
            const updatedData = await updateRes.json();
            
            return res.status(200).json({ room: updatedData[0], questions: JSON.parse(room.questions) });
        }

        // ACTION 3: SYNC / UPDATE SCORES LIVE
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

            // Return latest room status
            const syncRes = await fetch(`${supabaseUrl}/rest/v1/arena_battles?room_code=eq.${room_code}&select=*`, { headers });
            const syncData = await syncRes.json();
            return res.status(200).json({ room: syncData[0] });
        }

    } catch (error) {
        return res.status(500).json({ error: 'Arena server error' });
    }
}
