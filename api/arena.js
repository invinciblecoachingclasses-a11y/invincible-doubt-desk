export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY; 
    
    const { 
        action, 
        room_code, 
        player_name, 
        class_name, 
        subject,
        chapter,
        question_count,
        time_per_question,
        player_num, 
        total_score, 
        is_finished 
    } = req.body;

    const headers = { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`, 
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    // Instant Zero-Token Fallback Pool (Guarantees match starts even if offline/rate-limited)
    const staticFallbackPool = [
        { question_text: "What is the SI unit of electric current? / विद्युत धारा का SI मात्रक क्या है?", options: ["Ampere (A)", "Volt (V)", "Ohm (Ω)", "Watt (W)"], correct_option: 0, answer: 0, explanation: "Electric current is the rate of flow of charge, measured in Amperes." },
        { question_text: "If magnification m = -1 for a spherical mirror, where is the object placed?", options: ["At Infinity", "At Focus (F)", "At Centre of Curvature (C)", "Between F and P"], correct_option: 2, answer: 2, explanation: "Negative magnification means a real, inverted image of equal size, occurring only at C." },
        { question_text: "Which gas turns lime water milky? / चूने के पानी को कौन सी गैस दूधिया कर देती है?", options: ["CO2 (Carbon Dioxide)", "O2 (Oxygen)", "H2 (Hydrogen)", "N2 (Nitrogen)"], correct_option: 0, answer: 0, explanation: "CO2 reacts with calcium hydroxide to precipitate white Calcium Carbonate (CaCO3)." },
        { question_text: "The acceleration due to gravity 'g' at the center of the Earth is:", options: ["9.8 m/s²", "Zero (0)", "Infinite", "4.9 m/s²"], correct_option: 1, answer: 1, explanation: "Mass attracts uniformly in all directions at Earth's center, creating zero net gravity." },
        { question_text: "What is the equivalent resistance of two 4Ω resistors connected in parallel?", options: ["8Ω", "4Ω", "2Ω", "1Ω"], correct_option: 2, answer: 2, explanation: "1/Req = 1/4 + 1/4 = 2/4 = 1/2 => Req = 2Ω." },
        { question_text: "Which chemical formula represents Plaster of Paris?", options: ["CaSO4·2H2O", "CaSO4·½H2O", "CaCO3", "CaO"], correct_option: 1, answer: 1, explanation: "Plaster of Paris is Calcium Sulphate Hemihydrate (CaSO4·½H2O)." },
        { question_text: "For a projectile, maximum horizontal range occurs at an angle of:", options: ["30°", "45°", "60°", "90°"], correct_option: 1, answer: 1, explanation: "Range R = (u² sin 2θ)/g. Maximum when sin 2θ = 1 ⇒ θ = 45°." },
        { question_text: "Which organelle is known as the powerhouse of the cell?", options: ["Ribosome", "Mitochondria", "Nucleus", "Golgi Body"], correct_option: 1, answer: 1, explanation: "Mitochondria synthesize ATP through cellular respiration." },
        { question_text: "What is the net electric flux through a Gaussian surface enclosing a dipole?", options: ["q / ε₀", "2q / ε₀", "Zero (0)", "Infinite"], correct_option: 2, answer: 2, explanation: "A dipole has net charge (+q - q) = 0. By Gauss's Law, total flux is zero." },
        { question_text: "If sin θ + sin² θ = 1, then the value of cos² θ + cos⁴ θ is:", options: ["0", "1", "2", "-1"], correct_option: 1, answer: 1, explanation: "sin θ = 1 - sin² θ = cos² θ. Squaring both sides: sin² θ = cos⁴ θ. Thus cos² θ + cos⁴ θ = 1." }
    ];

    try {
        // ==========================================
        // ACTION 1: CREATE ROOM (CUSTOM TOPIC & TIME)
        // ==========================================
        if (action === 'create') {
            const code = Math.floor(1000 + Math.random() * 9000).toString(); 
            const count = parseInt(question_count, 10) || 10;
            const timerSec = parseInt(time_per_question, 10) || 15;
            const targetSubject = subject || 'Science & Maths';
            const targetTopic = chapter ? `Subject: ${targetSubject}, Specific Chapter/Topics: ${chapter}` : `Subject: ${targetSubject}`;

            let finalQuestions = [];

            // Attempt AI generation if key is present
            if (geminiKey) {
                try {
                    const prompt = `You are creating a rapid gamified quiz arena for Class ${class_name || '10'} students.
Topic & Context: ${targetTopic}.
Target Question Count: ${count}.
Time per question: ${timerSec} seconds.

REQUIREMENTS:
- Generate exactly ${count} fast, punchy, tricky, and engaging multiple-choice questions.
- Short question stems and clear options (A, B, C, D) readable within ${timerSec} seconds.
- Provide a 1-sentence quick explanation for immediate student feedback on mistake.
- Output MUST be a strictly valid JSON array of ${count} objects without markdown ticks.

SCHEMA:
[
  {
    "question": "Short punchy question?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Quick 1-line concept fact."
  }
]`;

                    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                responseMimeType: "application/json"
                            }
                        })
                    });

                    const geminiData = await geminiRes.json();
                    if (geminiRes.ok && geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
                        const parsed = JSON.parse(geminiData.candidates[0].content.parts[0].text);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            finalQuestions = parsed.map((q, idx) => ({
                                id: idx + 1,
                                question_text: q.question || q.question_text,
                                options: q.options || [],
                                correct_option: q.answer !== undefined ? q.answer : (q.correct_option || 0),
                                answer: q.answer !== undefined ? q.answer : (q.correct_option || 0),
                                explanation: q.explanation || "Review NCERT fundamental formulas."
                            }));
                        }
                    }
                } catch (aiErr) {
                    console.error("AI Generation fallback to database questions:", aiErr);
                }
            }

            // Fallback: Pull existing questions from database or static pool
            if (!finalQuestions || finalQuestions.length === 0) {
                try {
                    if (supabaseUrl && supabaseKey) {
                        const qRes = await fetch(`${supabaseUrl}/rest/v1/weekly_tests?select=*&limit=50`, { headers });
                        const allQuestions = await qRes.json();
                        if (Array.isArray(allQuestions) && allQuestions.length > 0) {
                            finalQuestions = allQuestions
                                .sort(() => 0.5 - Math.random())
                                .slice(0, count)
                                .map((q, idx) => ({
                                    id: idx + 1,
                                    question_text: q.question || q.question_text || "CBSE Concept Check",
                                    options: q.options || [q.option_1, q.option_2, q.option_3, q.option_4].filter(Boolean),
                                    correct_option: q.correct_option !== undefined ? q.correct_option : (q.answer || 0),
                                    answer: q.correct_option !== undefined ? q.correct_option : (q.answer || 0),
                                    explanation: q.explanation || "Review fundamental rules."
                                }));
                        }
                    }
                } catch (dbErr) {
                    console.error("Database fallback error:", dbErr);
                }

                // Final safety fallback
                if (!finalQuestions || finalQuestions.length === 0) {
                    finalQuestions = staticFallbackPool.slice(0, count);
                }
            }

            // Save match setup into Supabase if configured
            if (supabaseUrl && supabaseKey) {
                await fetch(`${supabaseUrl}/rest/v1/arena_battles`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        room_code: code,
                        subject: `${targetSubject}${chapter ? ` (${chapter})` : ''}`,
                        player1_name: player_name || 'Player 1',
                        questions: JSON.stringify(finalQuestions),
                        status: 'waiting'
                    })
                }).catch(() => {});
            }

            return res.status(200).json({ 
                room_code: code, 
                questions: finalQuestions, 
                time_per_question: timerSec,
                question_count: count 
            });
        }

        // ==========================================
        // ACTION 2: JOIN ROOM
        // ==========================================
        if (action === 'join') {
            if (!supabaseUrl || !supabaseKey) {
                return res.status(200).json({
                    room: { player1_name: 'Opponent', player2_name: player_name, status: 'playing' },
                    questions: staticFallbackPool.slice(0, 5)
                });
            }

            const rRes = await fetch(`${supabaseUrl}/rest/v1/arena_battles?room_code=eq.${room_code}&select=*`, { headers });
            const rooms = await rRes.json();
            
            if (!rooms || rooms.length === 0) return res.status(404).json({ error: 'Room code not found.' });
            const room = rooms[0];
            if (room.status !== 'waiting') return res.status(400).json({ error: 'This match is already in progress or ended.' });

            const updateRes = await fetch(`${supabaseUrl}/rest/v1/arena_battles?room_code=eq.${room_code}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ player2_name: player_name || 'Player 2', status: 'playing' })
            });
            const updatedData = await updateRes.json();
            
            let parsedQuestions = [];
            try {
                parsedQuestions = typeof room.questions === 'string' ? JSON.parse(room.questions) : room.questions;
            } catch (e) {
                parsedQuestions = staticFallbackPool.slice(0, 5);
            }

            return res.status(200).json({ 
                room: updatedData?.[0] || room, 
                questions: parsedQuestions 
            });
        }

        // ==========================================
        // ACTION 3: SYNC SCORE LIVE
        // ==========================================
        if (action === 'sync') {
            if (!supabaseUrl || !supabaseKey) {
                return res.status(200).json({
                    room: {
                        player1_score: player_num === 1 ? total_score : 0,
                        player2_score: player_num === 2 ? total_score : 0
                    }
                });
            }

            if (total_score !== undefined) {
                const updateBody = {};
                updateBody[`player${player_num}_score`] = total_score;
                if (is_finished) updateBody[`player${player_num}_finished`] = true;

                await fetch(`${supabaseUrl}/rest/v1/arena_battles?room_code=eq.${room_code}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(updateBody)
                }).catch(() => {});
            }

            const syncRes = await fetch(`${supabaseUrl}/rest/v1/arena_battles?room_code=eq.${room_code}&select=*`, { headers });
            const syncData = await syncRes.json();
            return res.status(200).json({ room: syncData?.[0] || {} });
        }

        return res.status(400).json({ error: 'Invalid action parameter' });

    } catch (error) {
        console.error("Arena Handler Error:", error);
        return res.status(500).json({ error: error.message || 'Server error. Please try again.' });
    }
}
