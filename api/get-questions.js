export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
        // 1. Fetch Weekly Test Questions
        const qRes = await fetch(`${supabaseUrl}/rest/v1/weekly_tests?select=*`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const questions = await qRes.json();

        // 2. Fetch Today's Daily Puzzle
        const today = new Date().toISOString().split('T')[0];
        const pRes = await fetch(`${supabaseUrl}/rest/v1/daily_puzzle?puzzle_date=eq.${today}&select=*`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const puzzles = await pRes.json();

        // 3. Fetch Top 5 Leaderboard Scores
        const lRes = await fetch(`${supabaseUrl}/rest/v1/test_attempts?select=student_name,student_class,subject,percentage&order=percentage.desc,created_at.desc&limit=5`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const leaderboard = await lRes.json();

        res.status(200).json({
            questions: Array.isArray(questions) ? questions : [],
            dailyPuzzle: Array.isArray(puzzles) && puzzles.length > 0 ? puzzles[0] : null,
            leaderboard: Array.isArray(leaderboard) ? leaderboard : []
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch platform data' });
    }
}
