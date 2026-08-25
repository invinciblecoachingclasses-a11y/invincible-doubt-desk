export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Fallback Daily Puzzle (Zero-Crash Guarantee)
    const fallbackPuzzle = {
        id: 999,
        question: "Is √(-4) × √(-9) equal to +6 or -6? / क्या √(-4) × √(-9) का मान +6 या -6 है?",
        options: ["+6", "-6", "±6", "Not Real"],
        correct_option: 1,
        explanation: "√(-4) × √(-9) = (2i) × (3i) = 6i² = -6 (since i² = -1).",
        xp_reward: 50
    };

    if (!supabaseUrl || !supabaseKey) {
        return res.status(200).json({
            questions: [],
            dailyPuzzle: fallbackPuzzle,
            leaderboard: [],
            reelDeck: []
        });
    }

    const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
    };

    try {
        const { target_class, type } = req.query;
        const today = new Date().toISOString().split('T')[0];

        // 1. Fetch Weekly Test Questions
        const qPromise = fetch(`${supabaseUrl}/rest/v1/weekly_tests?select=*&limit=50`, { headers })
            .then(r => r.ok ? r.json() : [])
            .catch(() => []);

        // 2. Fetch Today's Daily Puzzle (with date fallback)
        const pPromise = fetch(`${supabaseUrl}/rest/v1/daily_puzzle?puzzle_date=eq.${today}&select=*`, { headers })
            .then(r => r.ok ? r.json() : [])
            .catch(() => []);

        // 3. Fetch Leaderboard Scores
        const lPromise = fetch(`${supabaseUrl}/rest/v1/test_attempts?select=*&order=percentage.desc,created_at.desc&limit=7`, { headers })
            .then(r => r.ok ? r.json() : [])
            .catch(() => []);

        // 4. Fetch Dynamic Reels from Supabase
        let reelQuery = `${supabaseUrl}/rest/v1/study_reels?select=*&order=id.asc&limit=150`;
        if (target_class) {
            reelQuery = `${supabaseUrl}/rest/v1/study_reels?class_name=eq.${target_class}&select=*&order=id.asc&limit=150`;
        }
        const rPromise = fetch(reelQuery, { headers })
            .then(r => r.ok ? r.json() : [])
            .catch(() => []);

        // Execute all queries in parallel for lowest response latency
        const [questions, puzzles, leaderboard, reelDeck] = await Promise.all([
            qPromise,
            pPromise,
            lPromise,
            rPromise
        ]);

        const selectedPuzzle = (Array.isArray(puzzles) && puzzles.length > 0) ? puzzles[0] : fallbackPuzzle;

        // Set high-concurrency caching headers to handle traffic spikes at 9:00 PM without DB choke
        res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

        return res.status(200).json({
            questions: Array.isArray(questions) ? questions : [],
            dailyPuzzle: selectedPuzzle,
            leaderboard: Array.isArray(leaderboard) ? leaderboard : [],
            reelDeck: Array.isArray(reelDeck) ? reelDeck : []
        });
    } catch (error) {
        return res.status(200).json({
            questions: [],
            dailyPuzzle: fallbackPuzzle,
            leaderboard: [],
            reelDeck: []
        });
    }
}
