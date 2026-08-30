/**
 * =====================================================
 * INVINCIBLE 360 - CORE APPLICATION SERVER
 * Endpoints: Reels Telemetry, Stories, Doubt Solver, Static Assets
 * =====================================================
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(path.join(__dirname)));

// In-Memory Database Fallbacks
let globalLeaderboard = [];
let communityStories = [];

// -----------------------------------------------------
// 1. REELS QUESTION FEED API
// -----------------------------------------------------
app.get('/api/get-questions', (req, res) => {
  const targetClass = req.query.target_class || '10';
  
  // Dynamic question bank fallback
  const questionPool = {
    "9": [
      { id: 910, class_name: "9", type: "mcq", title: "Law of Conservation of Momentum", subject: "Physics", topic: "Forces", q_en: "When a gun recoils upon firing, total momentum of the system is:", options: ["Zero", "Conserved", "Increased", "Lost to Heat"], answer: 1, time: 10, trap: "Net external force on the system is zero, so linear momentum is conserved.", difficulty: "easy" }
    ],
    "10": [
      { id: 110, class_name: "10", type: "mcq", title: "Refractive Index", subject: "Physics", topic: "Light", q_en: "The refractive index of glass relative to water is given by:", options: ["n_g / n_w", "n_w / n_g", "n_g × n_w", "n_w - n_g"], answer: 0, time: 10, trap: "Relative refractive index ₁n₂ = n₂ / n₁.", difficulty: "easy" }
    ],
    "11": [
      { id: 1110, class_name: "11", type: "mcq", title: "Carnot Efficiency", subject: "Physics", topic: "Thermodynamics", q_en: "Efficiency of a Carnot cycle working between T₁ (Source) and T₂ (Sink) is:", options: ["1 - (T₂/T₁)", "1 - (T₁/T₂)", "T₂ / T₁", "1 + (T₂/T₁)"], answer: 0, time: 15, trap: "Temperatures must strictly be in Kelvin.", difficulty: "medium" }
    ],
    "12": [
      { id: 1210, class_name: "12", type: "mcq", title: "Photoelectric Cutoff", subject: "Physics", topic: "Dual Nature", q_en: "The maximum kinetic energy of emitted photoelectrons depends strictly on:", options: ["Light Frequency", "Light Intensity", "Source Distance", "Exposure Time"], answer: 0, time: 10, trap: "Kinetic energy depends on photon energy (hν), while intensity determines particle count.", difficulty: "easy" }
    ]
  };

  const deck = questionPool[targetClass] || questionPool["10"];
  res.json({ reelDeck: deck });
});

// -----------------------------------------------------
// 2. XP & PROGRESS TELEMETRY APIS
// -----------------------------------------------------
app.post('/api/update-xp', (req, res) => {
  const { card_id, xp_earned, streak, is_correct, timestamp } = req.body;
  
  // Record or log activity
  res.json({
    status: 'success',
    synced_xp: xp_earned || 0,
    current_streak: streak || 0,
    server_time: Date.now()
  });
});

app.post('/api/sync-offline-xp', (req, res) => {
  const { batch } = req.body;
  const count = Array.isArray(batch) ? batch.length : 0;
  res.json({ status: 'success', synced_count: count });
});

// -----------------------------------------------------
// 3. STORIES & COMMUNITY BROADCAST APIS
// -----------------------------------------------------
app.get('/api/stories', (req, res) => {
  const action = req.query.action;
  const storyId = req.query.story_id;

  if (action === 'get_viewers') {
    return res.json({ viewers: [] });
  }

  res.json({ stories: communityStories });
});

app.post('/api/stories', (req, res) => {
  const { action, author_name, institution, student_class, caption, media_url, story_id, reaction_type } = req.body;

  if (action === 'create_story') {
    const newStory = {
      id: Date.now(),
      author_name: author_name || 'Student',
      institution: institution || 'Invincible Coaching',
      class_name: student_class || '10',
      caption: caption || '',
      media_url: media_url || null,
      reactions_fire: 0,
      reactions_mind: 0,
      reactions_100: 0,
      created_at: new Date().toISOString()
    };
    communityStories.unshift(newStory);
    return res.json({ status: 'success', story: newStory });
  }

  if (action === 'react') {
    const story = communityStories.find(s => String(s.id) === String(story_id));
    if (story) {
      if (reaction_type === 'fire') story.reactions_fire = (story.reactions_fire || 0) + 1;
      if (reaction_type === 'mind') story.reactions_mind = (story.reactions_mind || 0) + 1;
      if (reaction_type === '100') story.reactions_100 = (story.reactions_100 || 0) + 1;
    }
    return res.json({ status: 'success' });
  }

  res.json({ status: 'acknowledged' });
});

// -----------------------------------------------------
// 4. FRONTEND ROOT ROUTING
// -----------------------------------------------------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.html'));
});

// Server Start
app.listen(PORT, () => {
  console.log(`⚡ Invincible 360 Engine live at: http://localhost:${PORT}`);
});
