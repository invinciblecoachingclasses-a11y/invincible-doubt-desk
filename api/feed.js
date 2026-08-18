export default async function handler(req, res) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const headers = { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`, 
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    // Helper: Anti-Abuse & Personal Contact Filter
    function checkProfanity(text) {
        if (!text) return false;
        const lower = text.toLowerCase();
        
        // Blocked vulgar/abusive words (English & Hinglish common roots)
        const bannedWords = [
            'bc', 'mc', 'bkl', 'chutiya', 'gandu', 'madarchod', 'behenchod', 'harami', 
            'randi', 'bhosdike', 'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'dick', 'pussy'
        ];
        
        for (let word of bannedWords) {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            if (regex.test(lower)) return true;
        }

        // Block Social Media handles and Phone Numbers
        const phoneRegex = /\b[6-9]\d{9}\b/; // 10 digit Indian mobile numbers
        const socialRegex = /(instagram\.com|snapchat\.com|t\.me\/|wa\.me\/|@insta|follow me)/i;
        
        if (phoneRegex.test(lower) || socialRegex.test(lower)) return true;

        return false;
    }

    // 1. GET FEED POSTS & COMMENTS
    if (req.method === 'GET') {
        const { action, post_id, subject, student_class } = req.query;

        try {
            if (action === 'get_comments') {
                const comRes = await fetch(`${supabaseUrl}/rest/v1/community_comments?post_id=eq.${post_id}&order=created_at.asc`, { headers });
                const comments = await comRes.json();
                return res.status(200).json({ comments });
            }

            // Get Posts (Filter by report_count < 3 to auto-hide reported content)
            let url = `${supabaseUrl}/rest/v1/community_posts?report_count=lt.3&order=created_at.desc&limit=40`;
            if (subject && subject !== 'All') url += `&subject=eq.${encodeURIComponent(subject)}`;
            if (student_class && student_class !== 'All') url += `&student_class=eq.${encodeURIComponent(student_class)}`;

            const postRes = await fetch(url, { headers });
            const posts = await postRes.json();
            return res.status(200).json({ posts });
        } catch (err) {
            return res.status(500).json({ error: 'Failed to fetch feed data.' });
        }
    }

    // 2. CREATE POST OR COMMENT
    if (req.method === 'POST') {
        const { action, author_name, institution, student_class, subject, content, image_url, post_id } = req.body;

        if (checkProfanity(content) || checkProfanity(author_name)) {
            return res.status(400).json({ error: 'Your post contains inappropriate language or prohibited contact info. Please keep discussions academic.' });
        }

        try {
            // Action: Create Post
            if (action === 'create_post') {
                if (!author_name || !institution || !content) {
                    return res.status(400).json({ error: 'Name, School/Coaching, and content are required.' });
                }

                const insertRes = await fetch(`${supabaseUrl}/rest/v1/community_posts`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        author_name: author_name.slice(0, 30),
                        institution: institution.slice(0, 40),
                        student_class,
                        subject,
                        content: content.slice(0, 1000),
                        image_url: image_url || null
                    })
                });
                const post = await insertRes.json();
                return res.status(200).json({ success: true, post: post[0] });
            }

            // Action: Add Comment
            if (action === 'add_comment') {
                if (!author_name || !content || !post_id) {
                    return res.status(400).json({ error: 'Missing comment parameters.' });
                }

                const comInsert = await fetch(`${supabaseUrl}/rest/v1/community_comments`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        post_id,
                        author_name: author_name.slice(0, 30),
                        institution: (institution || 'Student').slice(0, 40),
                        content: content.slice(0, 500)
                    })
                });
                const comment = await comInsert.json();
                return res.status(200).json({ success: true, comment: comment[0] });
            }

            // Action: Like Post
            if (action === 'like_post') {
                const fetchP = await fetch(`${supabaseUrl}/rest/v1/community_posts?id=eq.${post_id}`, { headers });
                const curr = await fetchP.json();
                if (curr && curr.length > 0) {
                    await fetch(`${supabaseUrl}/rest/v1/community_posts?id=eq.${post_id}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ likes_count: (curr[0].likes_count || 0) + 1 })
                    });
                }
                return res.status(200).json({ success: true });
            }

            // Action: Report Post (Auto-hide if >= 3)
            if (action === 'report_post') {
                const fetchP = await fetch(`${supabaseUrl}/rest/v1/community_posts?id=eq.${post_id}`, { headers });
                const curr = await fetchP.json();
                if (curr && curr.length > 0) {
                    await fetch(`${supabaseUrl}/rest/v1/community_posts?id=eq.${post_id}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ report_count: (curr[0].report_count || 0) + 1 })
                    });
                }
                return res.status(200).json({ success: true, message: 'Report received. Thank you for keeping the community clean.' });
            }
        } catch (err) {
            return res.status(500).json({ error: 'Server error processing request.' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
