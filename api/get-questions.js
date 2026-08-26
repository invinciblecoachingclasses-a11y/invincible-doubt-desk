export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const fallbackPuzzle = {
    id: 999,
    question: "Is √(-4) × √(-9) equal to +6 or -6? / क्या √(-4) × √(-9) का मान +6 या -6 है?",
    options: ["+6", "-6", "±6", "Not Real"],
    correct_option: 1,
    explanation: "√(-4) × √(-9) = (2i) × (3i) = 6i² = -6 (since i² = -1).",
    xp_reward: 50
  };

  const defaultReels = [
    {
      id: 901,
      class_name: "9",
      type: "mcq",
      subject: "Physics",
      topic: "Laws of Motion",
      q_en: "When a carpet is beaten with a stick, dust particles fall out. This phenomenon is explained by:",
      q_hi: "जब किसी कालीन को छड़ी से पीटा जाता है, तो धूल के कण बाहर निकल जाते हैं। यह किस कारण होता है?",
      options: ["Inertia of Rest", "Inertia of Motion", "Inertia of Direction", "Newton's Third Law"],
      answer: 0,
      trap: "The carpet moves with the stick, but dust particles remain at rest due to inertia of rest and separate out."
    },
    {
      id: 902,
      class_name: "9",
      type: "mcq",
      subject: "Physics",
      topic: "Motion",
      q_en: "Under what condition is the magnitude of average velocity equal to the average speed?",
      q_hi: "किस स्थिति में औसत वेग का परिमाण औसत चाल के बराबर होता है?",
      options: ["When object moves strictly along a straight line in one direction", "In circular motion", "When moving in a zig-zag path", "During free fall oscillations"],
      answer: 0,
      trap: "Distance equals displacement only when moving in a unidirectional straight path."
    },
    {
      id: 1001,
      class_name: "10",
      type: "mcq",
      subject: "Physics",
      topic: "Light & Optics",
      q_en: "If magnification m = -1 for a spherical mirror, where is the object placed?",
      q_hi: "यदि किसी गोलीय दर्पण के लिए m = -1 है, तो वस्तु कहाँ स्थित है?",
      options: ["At Focus (F)", "At Centre of Curvature (C)", "At Infinity", "Between F and P"],
      answer: 1,
      trap: "Negative magnification signifies real/inverted image of identical size, which occurs strictly at C."
    }
  ];

  // Randomize option order and update correct index pointer
  function shuffleReelOptions(reelsList) {
    return (reelsList || []).map(reel => {
      if (reel.type !== 'mcq') return reel;

      let rawOpts = reel.options;
      if (typeof rawOpts === 'string') {
        try { rawOpts = JSON.parse(rawOpts); } catch(e) { rawOpts = []; }
      }

      if (!Array.isArray(rawOpts) || rawOpts.length < 2) {
        if (reel.option_1 && reel.option_2) {
          rawOpts = [reel.option_1, reel.option_2, reel.option_3, reel.option_4].filter(Boolean);
        } else {
          return reel;
        }
      }

      const originalCorrectIdx = Number(reel.answer !== undefined ? reel.answer : (reel.correct_option || 0));

      const indexed = rawOpts.map((opt, idx) => ({
        text: opt,
        isCorrect: idx === originalCorrectIdx
      }));

      // Fisher-Yates Shuffle
      for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
      }

      return {
        ...reel,
        options: indexed.map(o => o.text),
        answer: indexed.findIndex(o => o.isCorrect)
      };
    });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      questions: [],
      dailyPuzzle: fallbackPuzzle,
      leaderboard: [],
      reelDeck: shuffleReelOptions(defaultReels)
    });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  };

  try {
    const { target_class } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const qPromise = fetch(`${supabaseUrl}/rest/v1/weekly_tests?select=*&limit=50`, { headers })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);

    const pPromise = fetch(`${supabaseUrl}/rest/v1/daily_puzzle?puzzle_date=eq.${today}&select=*`, { headers })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);

    const lPromise = fetch(`${supabaseUrl}/rest/v1/test_attempts?select=*&order=percentage.desc,created_at.desc&limit=7`, { headers })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);

    let reelQuery = `${supabaseUrl}/rest/v1/study_reels?select=*&order=id.asc&limit=150`;
    if (target_class) {
      reelQuery = `${supabaseUrl}/rest/v1/study_reels?class_name=eq.${target_class}&select=*&order=id.asc&limit=150`;
    }
    const rPromise = fetch(reelQuery, { headers })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);

    const [questions, puzzles, leaderboard, dbReels] = await Promise.all([
      qPromise,
      pPromise,
      lPromise,
      rPromise
    ]);

    const selectedPuzzle = (Array.isArray(puzzles) && puzzles.length > 0) ? puzzles[0] : fallbackPuzzle;
    const rawReelPool = (Array.isArray(dbReels) && dbReels.length > 0) ? dbReels : defaultReels;
    const processedReels = shuffleReelOptions(rawReelPool);

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');

    return res.status(200).json({
      questions: Array.isArray(questions) ? questions : [],
      dailyPuzzle: selectedPuzzle,
      leaderboard: Array.isArray(leaderboard) ? leaderboard : [],
      reelDeck: processedReels
    });
  } catch (error) {
    return res.status(200).json({
      questions: [],
      dailyPuzzle: fallbackPuzzle,
      leaderboard: [],
      reelDeck: shuffleReelOptions(defaultReels)
    });
  }
}
