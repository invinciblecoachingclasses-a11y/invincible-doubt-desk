export default async function handler(req, res) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const headers = { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`, 
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    // 1. GET ACTIVE 24-HOUR STORIES OR STORY VIEWERS
    if (req.method === 'GET') {
        const { action, story_id } = req.query;

        try {
            // Action: Get viewers & reactions for a specific story
            if (action === 'get_viewers') {
                if (!story_id) return res.status(400).json({ error: 'Missing story_id' });
                const response = await fetch(`${supabaseUrl}/rest/v1/story_views?story_id=eq.${story_id}&order=viewed_at.desc`, { headers });
                const viewers = await response.json();
                return res.status(200).json({ viewers: Array.isArray(viewers) ? viewers : [] });
            }

            // Default: Get 24-hour active stories
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const response = await fetch(`${supabaseUrl}/rest/v1/study_stories?created_at=gt.${cutoff}&order=created_at.desc&limit=30`, { headers });
            const stories = await response.json();
            return res.status(200).json({ stories: Array.isArray(stories) ? stories : [] });
        } catch (err) {
            return res.status(500).json({ error: 'Failed to load stories data.' });
        }
    }

    // 2. CREATE STORY / VOTE / REACT / RECORD VIEW / DELETE
    if (req.method === 'POST') {
        const { 
            action, 
            author_name, 
            institution, 
            student_class, 
            media_url, 
            image_data, 
            caption, 
            sticker_question, 
            sticker_opt_a, 
            sticker_opt_b, 
            sticker_correct_opt, 
            streak_count, 
            story_id, 
            vote_opt, 
            reaction_type, 
            viewer_name, 
            viewer_institution 
        } = req.body;

        try {
            // Action: Record a Story View
            if (action === 'record_view') {
                if (!story_id || !viewer_name) return res.status(400).json({ error: 'Missing parameters.' });
                
                await fetch(`${supabaseUrl}/rest/v1/story_views`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        story_id: Number(story_id),
                        viewer_name: viewer_name.slice(0, 30),
                        viewer_institution: (viewer_institution || 'Invincible Student').slice(0, 40)
                    })
                });
                return res.status(200).json({ success: true });
            }

            // Action: Create Story
            if (action === 'create_story') {
                if (!author_name || !institution) {
                    return res.status(400).json({ error: 'Name and School/Coaching are required.' });
                }

                const insertRes = await fetch(`${supabaseUrl}/rest/v1/study_stories`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        author_name: author_name.slice(0, 30),
                        institution: institution.slice(0, 40),
                        student_class: student_class || '10',
                        media_url: media_url || image_data || null,
                        caption: (caption || '').slice(0, 300),
                        sticker_question: sticker_question ? sticker_question.slice(0, 120) : null,
                        sticker_opt_a: sticker_opt_a ? sticker_opt_a.slice(0, 50) : null,
                        sticker_opt_b: sticker_opt_b ? sticker_opt_b.slice(0, 50) : null,
                        sticker_correct_opt: Number(sticker_correct_opt) || 0,
                        streak_count: Number(streak_count) || 1,
                        is_topper: Number(streak_count) >= 5
                    })
                });
                const story = await insertRes.json();
                return res.status(200).json({ success: true, story: story[0] });
            }

            // Action: Vote on Story Sticker
            if (action === 'vote_sticker') {
                const fetchS = await fetch(`${supabaseUrl}/rest/v1/study_stories?id=eq.${story_id}`, { headers });
                const curr = await fetchS.json();
                if (curr && curr.length > 0) {
                    const updateField = vote_opt === 0 ? 'poll_votes_a' : 'poll_votes_b';
                    const currentVal = curr[0][updateField] || 0;
                    await fetch(`${supabaseUrl}/rest/v1/study_stories?id=eq.${story_id}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ [updateField]: currentVal + 1 })
                    });
                }
                return res.status(200).json({ success: true });
            }

            // Action: React with Emoji
            if (action === 'react') {
                const fetchS = await fetch(`${supabaseUrl}/rest/v1/study_stories?id=eq.${story_id}`, { headers });
                const curr = await fetchS.json();
                if (curr && curr.length > 0) {
                    let field = 'reactions_fire';
                    if (reaction_type === 'mind') field = 'reactions_mind';
                    if (reaction_type === '100') field = 'reactions_100';

                    const currentVal = curr[0][field] || 0;
                    await fetch(`${supabaseUrl}/rest/v1/study_stories?id=eq.${story_id}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ [field]: currentVal + 1 })
                    });

                    if (viewer_name) {
                        await fetch(`${supabaseUrl}/rest/v1/story_views`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                                story_id: Number(story_id),
                                viewer_name: viewer_name.slice(0, 30),
                                viewer_institution: (viewer_institution || 'Invincible Student').slice(0, 40),
                                reaction: reaction_type
                            })
                        });
                    }
                }
                return res.status(200).json({ success: true });
            }
            
            // Action: Delete Story
            if (action === 'delete_story') {
                const { admin_key } = req.body;
                const MASTER_ADMIN_PIN = "ADMIN123";

                if (!story_id) return res.status(400).json({ error: 'Missing story ID.' });

                if (admin_key && admin_key !== MASTER_ADMIN_PIN) {
                    return res.status(403).json({ error: 'Invalid Admin PIN.' });
                }

                const deleteRes = await fetch(`${supabaseUrl}/rest/v1/study_stories?id=eq.${story_id}`, {
                    method: 'DELETE',
                    headers
                });

                if (!deleteRes.ok) {
                    return res.status(500).json({ error: 'Failed to delete story.' });
                }

                return res.status(200).json({ success: true, message: 'Story deleted successfully.' });
            }

        } catch (err) {
            return res.status(500).json({ error: 'Server error processing story.' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
