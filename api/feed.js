export default async function handler(req, res) {
    // ============================================================
    // CORS HEADERS
    // ============================================================
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Zero-crash fallback sample posts
    const samplePosts = [
        {
            id: 1,
            school_name: "Bharat Public School",
            category: "teacher_intel",
            title: "Chemistry Viva Important Topics",
            content: "External teacher is focusing heavily on Titration equations and Organic functional group tests. Be prepared!",
            author_name: "Anonymous Backbencher",
            batch_tag: "Class 12th",
            is_anonymous: true,
            upvotes: 14,
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            school_name: "DVM Public School",
            category: "syllabus_notes",
            title: "Physics Ch 9 Ray Optics Notes",
            content: "Diagrams for telescope and compound microscope derivations will definitely come in 5 marks.",
            author_name: "Rohan K.",
            batch_tag: "Class 12th Sci",
            is_anonymous: false,
            upvotes: 22,
            created_at: new Date().toISOString()
        }
    ];

    if (!supabaseUrl || !supabaseKey) {
        return res.status(200).json({ posts: samplePosts, comments: [] });
    }

    const headers = { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`, 
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    // Helper: Anti-Abuse & Contact Safety Filter
    function checkProfanity(text) {
        if (!text) return false;
        const lower = String(text).toLowerCase();
        
        const bannedWords = [
            'bc', 'mc', 'bkl', 'chutiya', 'gandu', 'madarchod', 'behenchod', 'harami', 
            'randi', 'bhosdike', 'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'dick', 'pussy'
        ];
        
        for (const word of bannedWords) {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            if (regex.test(lower)) return true;
        }

        // Block 10-digit phone numbers and external social handles
        const phoneRegex = /\b[6-9]\d{9}\b/;
        const socialRegex = /(instagram\.com|snapchat\.com|t\.me\/|wa\.me\/|@insta|follow me)/i;
        
        if (phoneRegex.test(lower) || socialRegex.test(lower)) return true;

        return false;
    }

    // ============================================================
    // 1. GET: FETCH POSTS & COMMENTS
    // ============================================================
    if (req.method === 'GET') {
        const { action, post_id, school, category, subject, student_class } = req.query;

        try {
            if (action === 'get_comments') {
                const comRes = await fetch(`${supabaseUrl}/rest/v1/community_comments?post_id=eq.${post_id}&order=created_at.asc`, { headers });
                const comments = await comRes.json();
                return res.status(200).json({ comments: Array.isArray(comments) ? comments : [] });
            }

            // Build dynamic filtered query for school and campus posts
            let url = `${supabaseUrl}/rest/v1/school_posts?order=created_at.desc&limit=50`;
            const conditions = [];

            if (school && school !== 'ALL') {
                conditions.push(`school_name=eq.${encodeURIComponent(school)}`);
            }
            if (category && category !== 'ALL') {
                conditions.push(`category=eq.${encodeURIComponent(category)}`);
            }
            if (subject && subject !== 'All') {
                conditions.push(`subject=eq.${encodeURIComponent(subject)}`);
            }
            if (student_class && student_class !== 'All') {
                conditions.push(`batch_tag=eq.${encodeURIComponent(student_class)}`);
            }

            if (conditions.length > 0) {
                url = `${supabaseUrl}/rest/v1/school_posts?${conditions.join('&')}&order=created_at.desc&limit=50`;
            }

            const postRes = await fetch(url, { headers });
            let posts = await postRes.json();

            // Fallback to community_posts table if school_posts hasn't been queried yet
            if (!Array.isArray(posts) || posts.length === 0) {
                const fallbackRes = await fetch(`${supabaseUrl}/rest/v1/community_posts?order=created_at.desc&limit=30`, { headers });
                const fallbackPosts = await fallbackRes.json();
                if (Array.isArray(fallbackPosts) && fallbackPosts.length > 0) {
                    posts = fallbackPosts.map(p => ({
                        id: p.id,
                        school_name: p.institution || p.school_name || "Campus Community",
                        category: p.category || "syllabus_notes",
                        title: p.title || (p.content ? p.content.slice(0, 40) + '...' : "Campus Discussion"),
                        content: p.content || "",
                        author_name: p.author_name || "Student",
                        batch_tag: p.student_class || "Class 10",
                        is_anonymous: p.is_anonymous ?? true,
                        upvotes: p.likes_count || p.upvotes || 0,
                        created_at: p.created_at
                    }));
                }
            }

            return res.status(200).json({ 
                posts: Array.isArray(posts) && posts.length > 0 ? posts : samplePosts 
            });
        } catch (err) {
            console.error("Fetch feed error:", err);
            return res.status(200).json({ posts: samplePosts });
        }
    }

    // ============================================================
    // 2. POST: CREATE POST / COMMENT / UPVOTE
    // ============================================================
    if (req.method === 'POST') {
        const { 
            action, 
            author_name, 
            school_name, 
            institution, 
            category, 
            batch_tag, 
            student_class, 
            title, 
            content, 
            is_anonymous, 
            post_id 
        } = req.body || {};

        if (checkProfanity(content) || checkProfanity(title) || checkProfanity(author_name)) {
            return res.status(400).json({ 
                error: 'Your post contains inappropriate language or external contact info. Please keep discussions academic.' 
            });
        }

        try {
            // Action: Create Campus Post
            if (!action || action === 'create_post') {
                const targetSchool = school_name || institution || 'Invincible Coaching';
                const postTitle = title || (content ? content.slice(0, 50) : 'Study Update');

                if (!content) {
                    return res.status(400).json({ error: 'Post content cannot be empty.' });
                }

                const postPayload = {
                    school_name: String(targetSchool).slice(0, 50),
                    category: category || 'syllabus_notes',
                    batch_tag: String(batch_tag || student_class || 'Class 10').slice(0, 20),
                    title: String(postTitle).slice(0, 100),
                    content: String(content).slice(0, 1500),
                    is_anonymous: Boolean(is_anonymous),
                    author_name: is_anonymous ? 'Anonymous Backbencher' : String(author_name || 'Student').slice(0, 30),
                    upvotes: 0,
                    created_at: new Date().toISOString()
                };

                const insertRes = await fetch(`${supabaseUrl}/rest/v1/school_posts`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(postPayload)
                });
                
                const post = await insertRes.json();
                return res.status(200).json({ 
                    success: true, 
                    post: Array.isArray(post) ? post[0] : post 
                });
            }

            // Action: Upvote / Like Post
            if (action === 'upvote' || action === 'like_post') {
                const fetchP = await fetch(`${supabaseUrl}/rest/v1/school_posts?id=eq.${post_id}`, { headers });
                const curr = await fetchP.json();
                if (Array.isArray(curr) && curr.length > 0) {
                    await fetch(`${supabaseUrl}/rest/v1/school_posts?id=eq.${post_id}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ upvotes: (curr[0].upvotes || 0) + 1 })
                    });
                }
                return res.status(200).json({ success: true });
            }

            // Action: Add Comment
            if (action === 'add_comment') {
                if (!content || !post_id) {
                    return res.status(400).json({ error: 'Missing comment text or post ID.' });
                }

                const comInsert = await fetch(`${supabaseUrl}/rest/v1/community_comments`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        post_id,
                        author_name: String(author_name || 'Student').slice(0, 30),
                        institution: String(institution || school_name || 'Campus Student').slice(0, 40),
                        content: String(content).slice(0, 500),
                        created_at: new Date().toISOString()
                    })
                });
                const comment = await comInsert.json();
                return res.status(200).json({ 
                    success: true, 
                    comment: Array.isArray(comment) ? comment[0] : comment 
                });
            }

            return res.status(400).json({ error: 'Invalid feed action' });

        } catch (err) {
            console.error("Feed POST Error:", err);
            return res.status(500).json({ error: 'Server error processing campus feed request.' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
